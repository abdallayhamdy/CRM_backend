<?php

namespace App\Http\Middleware;

use App\Models\PlatformSettings;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnforceIpWhitelist
{
    public function handle(Request $request, Closure $next): Response
    {
        $settings = PlatformSettings::instance();

        if (! $settings->ip_whitelist_enabled) {
            return $next($request);
        }

        $ip = $request->ip();

        foreach ($settings->whitelisted_ips ?? [] as $entry) {
            if ($this->matches($ip, $entry)) {
                return $next($request);
            }
        }

        return response()->json([
            'status' => 'error',
            'message' => 'Access denied from this IP address.',
        ], 403);
    }

    protected function matches(string $ip, string $entry): bool
    {
        $ip = $this->normalizeIp($ip);
        $entry = $this->normalizeIp($entry);

        if ($ip === $entry) {
            return true;
        }

        if (! str_contains($entry, '/')) {
            return false;
        }

        [$subnet, $bits] = explode('/', $entry, 2);

        if (! is_numeric($bits)) {
            return false;
        }

        $bits = (int) $bits;

        if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)
            && filter_var($subnet, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
            return $this->ipv4InCidr($ip, $subnet, $bits);
        }

        if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6)
            && filter_var($subnet, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6)) {
            return $this->ipv6InCidr($ip, $subnet, $bits);
        }

        return false;
    }

    protected function normalizeIp(string $ip): string
    {
        if (! filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6)) {
            return $ip;
        }

        $packed = inet_pton($ip);

        if ($packed === false) {
            return $ip;
        }

        // IPv4-mapped IPv6 addresses (::ffff:a.b.c.d) belong to the IPv4 space.
        if (substr($packed, 0, 12) === "\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\xff\xff") {
            return inet_ntop(substr($packed, 12));
        }

        return $ip;
    }

    protected function ipv4InCidr(string $ip, string $subnet, int $bits): bool
    {
        if ($bits < 0 || $bits > 32) {
            return false;
        }

        $mask = $bits === 0 ? 0 : ((-1 << (32 - $bits)) & 0xFFFFFFFF);

        return (ip2long($ip) & $mask) === (ip2long($subnet) & $mask);
    }

    protected function ipv6InCidr(string $ip, string $subnet, int $bits): bool
    {
        if ($bits < 0 || $bits > 128) {
            return false;
        }

        $ipBin = inet_pton($ip);
        $netBin = inet_pton($subnet);

        if ($ipBin === false || $netBin === false) {
            return false;
        }

        if ($bits === 0) {
            return true;
        }

        $mask = str_repeat("\xff", intdiv($bits, 8));

        if ($bits % 8 !== 0) {
            $mask .= chr(0xff << (8 - ($bits % 8)));
        }

        $mask = str_pad($mask, 16, "\0");

        return (($ipBin ^ $netBin) & $mask) === str_repeat("\0", 16);
    }
}
