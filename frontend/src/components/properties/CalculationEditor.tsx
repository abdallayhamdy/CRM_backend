"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { FORMULA_FUNCTIONS } from "./CreatePropertyConstants";
import { PropertySearchDropdown } from "./PropertySearchDropdown";
import { PropertyFormState } from "./CreatePropertyFormState";
import { laravelApi } from "@/lib/laravel-api";

type FormulaToken =
  | { type: "text"; value: string }
  | { type: "property"; display: string };

interface CalculationEditorProps {
  form: PropertyFormState;
  setForm: React.Dispatch<React.SetStateAction<PropertyFormState>>;
  objectType: string;
}

export function CalculationEditor({ form, setForm, objectType }: CalculationEditorProps) {
  // ── Formula toolbar state ──────────────────────────────────────────────────
  const [formulaTokens, setFormulaTokens] = useState<FormulaToken[]>([]);
  const [formulaProperties, setFormulaProperties] = useState<
    { id: string; name: string; label?: string; group_name: string }[]
  >([]);
  const [funcDropdownOpen, setFuncDropdownOpen] = useState(false);
  const [propDropdownOpen, setPropDropdownOpen] = useState(false);
  const [funcSearch, setFuncSearch] = useState("");
  const [propSearch, setPropSearch] = useState("");
  const funcDropdownRef = useRef<HTMLDivElement>(null);
  const propDropdownRef = useRef<HTMLDivElement>(null);
  const funcBtnRef = useRef<HTMLButtonElement>(null);
  const propBtnRef = useRef<HTMLButtonElement>(null);
  const formulaInputRef = useRef<HTMLInputElement>(null);
  const [funcDropdownPos, setFuncDropdownPos] = useState({ top: 0, left: 0 });
  const [propDropdownPos, setPropDropdownPos] = useState({ top: 0, left: 0 });

  // ── Number format state ────────────────────────────────────────────────────
  const [calcNumberFormatOpen, setCalcNumberFormatOpen] = useState(false);
  const calcNumberFormatRef = useRef<HTMLDivElement>(null);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const openFuncDropdown = () => {
    if (funcBtnRef.current) {
      const rect = funcBtnRef.current.getBoundingClientRect();
      setFuncDropdownPos({ top: rect.bottom + 4, left: rect.left });
    }
    setFuncDropdownOpen(true);
  };

  const openPropDropdown = () => {
    if (propBtnRef.current) {
      const rect = propBtnRef.current.getBoundingClientRect();
      setPropDropdownPos({ top: rect.bottom + 4, left: rect.left });
    }
    setPropDropdownOpen(true);
  };

  const insertIntoFormula = (text: string) => {
    setFormulaTokens((prev) => {
      const last = prev[prev.length - 1];
      if (last?.type === "text") {
        return [
          ...prev.slice(0, -1),
          { type: "text", value: last.value + " " + text },
        ];
      }
      return [...prev, { type: "text", value: text }];
    });
  };

  const insertProperty = (internalName: string, displayName: string) => {
    setFormulaTokens((prev) => [
      ...prev,
      { type: "property", display: displayName },
    ]);
    setPropDropdownOpen(false);
  };

  const updateTextToken = (index: number, value: string) => {
    setFormulaTokens((prev) => {
      const newTokens = [...prev];
      newTokens[index] = { ...newTokens[index], type: "text", value };
      return newTokens;
    });
  };

  const appendTextToken = (value: string) => {
    setFormulaTokens((prev) => {
      if (value.trim() === "") return prev;
      const newTokens = [...prev];
      const last = newTokens[newTokens.length - 1];
      if (last && last.type === "text") {
        newTokens[newTokens.length - 1] = {
          ...last,
          value: last.value + value,
        };
      } else {
        newTokens.push({ type: "text", value });
      }
      return newTokens;
    });
  };

  const handleFormulaKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      setFormulaTokens((prev) => [...prev, { type: "text", value: "" }]);
    } else if (e.key === "Backspace" && e.currentTarget.value === "") {
      setFormulaTokens((prev) => {
        if (prev.length === 0) return prev;
        return prev.slice(0, -1);
      });
    }
  };

  // ── Effects ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!propDropdownOpen) return;
    laravelApi
      .get<any[]>("/properties", {
        object_type: encodeURIComponent(objectType),
        limit: 500,
      })
      .then(({ data: res }) =>
        setFormulaProperties(
          ((res as {properties?: any[]})?.properties ?? []).filter((p: any) => !p.is_archived)
        )
      )
      .catch(() => {});
  }, [propDropdownOpen, objectType]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        funcDropdownRef.current &&
        !funcDropdownRef.current.contains(e.target as Node)
      ) {
        setFuncDropdownOpen(false);
      }
      if (
        propDropdownRef.current &&
        !propDropdownRef.current.contains(e.target as Node)
      ) {
        setPropDropdownOpen(false);
      }
      if (
        calcNumberFormatRef.current &&
        !calcNumberFormatRef.current.contains(e.target as Node)
      ) {
        setCalcNumberFormatOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Sync formula string to parent form state so handleSubmit can read it
  useEffect(() => {
    const formulaStr = formulaTokens.map(t => t.type === 'property' ? `[${t.display}]` : t.value).join(' ');
    if (form.calc_formula !== formulaStr) {
      setForm(p => ({ ...p, calc_formula: formulaStr || '' }));
    }
  }, [formulaTokens]);

  const isTimeBased = form.calc_property_type !== "custom_equation";

  return (
    <div className="space-y-6">
      {/* Learn more */}
      <p className="text-sm">
        <a
          href="#"
          className="text-status-success underline font-medium"
        >
          Learn more
        </a>{" "}
        about calculated properties and what you can build with them.
      </p>

      {/* Calculated property type */}
      <div className="space-y-1">
        <label className="text-sm font-medium">
          Calculated property type
        </label>
        <select
          value={form.calc_property_type}
          onChange={(e) =>
            setForm((p) => ({
              ...p,
              calc_property_type: e.target.value as any,
            }))
          }
          className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="custom_equation">Custom equation</option>
          <option value="time_between">Time between</option>
          <option value="time_since">Time since</option>
          <option value="time_until">Time until</option>
        </select>
        {isTimeBased && (
          <p className="text-xs text-muted-foreground">
            Choose the time between two dates.
          </p>
        )}
      </div>

      {/* Custom equation branch */}
      {form.calc_property_type === "custom_equation" && (
        <div className="space-y-4">
          {/* Output type */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Output type</label>
            <select
              value={form.calc_output_type}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  calc_output_type: e.target.value as any,
                }))
              }
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="number">Number</option>
              <option value="boolean">Boolean</option>
              <option value="string">String</option>
              <option value="date">Date</option>
              <option value="datetime">Date Time</option>
            </select>
          </div>

          {/* Date/Datetime info */}
          {["date", "datetime"].includes(form.calc_output_type) && (
            <p className="text-xs text-muted-foreground">
              Date and datetime property types are stored in milliseconds.
              When using them in equations,{" "}
              <a href="#" className="text-status-success underline">
                first convert your desired unit of time
              </a>{" "}
              (hours, days, months, etc) to milliseconds.
            </p>
          )}

          {/* Number format */}
          {form.calc_output_type === "number" && (
            <div className="space-y-1">
              <label className="text-sm font-medium">Number format</label>
              {(() => {
                const CALC_NUMBER_FORMATS = [
                  {
                    value: "formatted",
                    label: "Formatted number",
                    description: "Format your property as a number",
                  },
                  {
                    value: "unformatted",
                    label: "Unformatted number",
                    description: "Remove formatting from your property",
                  },
                  {
                    value: "currency",
                    label: "Currency",
                    description: "Format your property as a currency",
                  },
                  {
                    value: "percentage",
                    label: "Percentage",
                    description: "Format your property as a percentage",
                  },
                ];
                return (
                  <div className="relative" ref={calcNumberFormatRef}>
                    <button
                      type="button"
                      onClick={() =>
                        setCalcNumberFormatOpen(!calcNumberFormatOpen)
                      }
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <span>
                        {
                          CALC_NUMBER_FORMATS.find(
                            (f) => f.value === form.calc_number_format
                          )?.label
                        }
                      </span>
                      <ChevronDown className="w-4 h-4 shrink-0 opacity-50" />
                    </button>
                    {calcNumberFormatOpen && (
                      <div className="absolute z-[200] w-full border rounded-md bg-background shadow-md mt-1">
                        {CALC_NUMBER_FORMATS.map((opt) => (
                          <div
                            key={opt.value}
                            onClick={() => {
                              setForm((p) => ({
                                ...p,
                                calc_number_format: opt.value,
                              }));
                              setCalcNumberFormatOpen(false);
                            }}
                            className={`px-3 py-2 cursor-pointer hover:bg-muted ${
                              form.calc_number_format === opt.value
                                ? "bg-muted/50"
                                : ""
                            }`}
                          >
                            <p className="text-sm font-medium">{opt.label}</p>
                            <p className="text-xs text-muted-foreground">
                              {opt.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Formula editor */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-status-success">
              <span className="w-2 h-2 rounded-full bg-status-success inline-block" />
              No issues
            </div>
            <div className="border rounded-md">
              {/* Formula display area */}
              <div
                className="p-3 min-h-[80px] flex flex-wrap items-center gap-1 cursor-text"
                onClick={() => formulaInputRef.current?.focus()}
              >
                {formulaTokens.map((token, i) =>
                  token.type === "property" ? (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-full border text-sm font-medium bg-background flex items-center gap-1"
                    >
                      {token.display}
                      <button
                        onClick={() =>
                          setFormulaTokens((prev) =>
                            prev.filter((_, idx) => idx !== i)
                          )
                        }
                        className="text-muted-foreground hover:text-foreground text-xs leading-none"
                      >
                        ×
                      </button>
                    </span>
                  ) : (
                    <input
                      key={i}
                      type="text"
                      value={token.value}
                      onChange={(e) => updateTextToken(i, e.target.value)}
                      className="bg-transparent outline-none text-sm font-mono min-w-[4px]"
                      style={{
                        width: `${Math.max(token.value.length, 1)}ch`,
                      }}
                    />
                  )
                )}
                {/* Always have an editable text area at the end */}
                {(formulaTokens.length === 0 ||
                  formulaTokens[formulaTokens.length - 1].type ===
                    "property") && (
                  <input
                    ref={formulaInputRef}
                    type="text"
                    placeholder={
                      formulaTokens.length === 0 ? "Enter formula..." : ""
                    }
                    onKeyDown={(e) => handleFormulaKeyDown(e)}
                    onChange={(e) => appendTextToken(e.target.value)}
                    className="bg-transparent outline-none text-sm font-mono flex-1 min-w-[60px]"
                  />
                )}
                <span className="ml-auto text-xs text-muted-foreground uppercase font-mono self-start">
                  {form.calc_output_type}
                </span>
              </div>

              {/* Toolbar */}
              <div className="flex justify-between items-center border-t px-3 py-2 text-sm">
                <div className="flex gap-3 items-center">
                  <span className="text-muted-foreground">Insert</span>

                  {/* Functions dropdown */}
                  <div className="relative" ref={funcDropdownRef}>
                    <button
                      ref={funcBtnRef}
                      type="button"
                      className="font-medium hover:underline"
                      onClick={() => {
                        if (funcDropdownOpen) {
                          setFuncDropdownOpen(false);
                        } else {
                          openFuncDropdown();
                          setPropDropdownOpen(false);
                          setFuncSearch("");
                        }
                      }}
                    >
                      Functions ▾
                    </button>
                    {funcDropdownOpen && (
                      <div
                        style={{
                          position: "fixed",
                          top: funcDropdownPos.top,
                          left: funcDropdownPos.left,
                          zIndex: 9999,
                        }}
                        className="w-72 border rounded-md bg-background shadow-lg"
                      >
                        <div className="p-2 border-b">
                          <input
                            autoFocus
                            placeholder="Search"
                            value={funcSearch}
                            onChange={(e) => setFuncSearch(e.target.value)}
                            className="w-full outline-none text-sm px-2 py-1 border rounded-full"
                          />
                        </div>
                        <div className="max-h-64 overflow-y-auto">
                          {FORMULA_FUNCTIONS.filter((f) =>
                            f.name
                              .toLowerCase()
                              .includes(funcSearch.toLowerCase())
                          ).map((f) => (
                            <div
                              key={f.name}
                              onClick={() => {
                                insertIntoFormula(f.name + "()");
                                setFuncDropdownOpen(false);
                              }}
                              className="px-3 py-2 hover:bg-muted cursor-pointer"
                            >
                              <p className="text-sm font-medium">{f.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {f.description}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Properties dropdown */}
                  <div className="relative" ref={propDropdownRef}>
                    <button
                      ref={propBtnRef}
                      type="button"
                      className="font-medium hover:underline"
                      onClick={() => {
                        if (propDropdownOpen) {
                          setPropDropdownOpen(false);
                        } else {
                          openPropDropdown();
                          setFuncDropdownOpen(false);
                          setPropSearch("");
                        }
                      }}
                    >
                      Properties ▾
                    </button>
                    {propDropdownOpen && (
                      <div
                        style={{
                          position: "fixed",
                          top: propDropdownPos.top,
                          left: propDropdownPos.left,
                          zIndex: 9999,
                        }}
                        className="w-72 border rounded-md bg-background shadow-lg"
                      >
                        <div className="p-2 border-b">
                          <input
                            autoFocus
                            placeholder="Search"
                            value={propSearch}
                            onChange={(e) => setPropSearch(e.target.value)}
                            className="w-full outline-none text-sm px-2 py-1 border rounded-full"
                          />
                        </div>
                        <div className="max-h-64 overflow-y-auto">
                          {(() => {
                            const grouped = formulaProperties.reduce(
                              (acc, prop) => {
                                const group =
                                  prop.group_name || "Other";
                                if (!acc[group]) acc[group] = [];
                                acc[group].push(prop);
                                return acc;
                              },
                              {} as Record<
                                string,
                                typeof formulaProperties
                              >
                            );

                            const entries = Object.entries(grouped).filter(
                              ([group, props]) =>
                                props.some((p) =>
                                  p.name
                                    .toLowerCase()
                                    .includes(propSearch.toLowerCase())
                                )
                            );

                            if (entries.length === 0) {
                              return (
                                <div className="px-3 py-2 text-sm text-muted-foreground">
                                  No properties found
                                </div>
                              );
                            }

                            return entries.map(([group, props]) => (
                              <div key={group}>
                                <p className="px-3 py-1 text-sm font-semibold text-foreground border-b">
                                  {group}
                                </p>
                                {props
                                  .filter((p) =>
                                    p.name
                                      .toLowerCase()
                                      .includes(propSearch.toLowerCase())
                                  )
                                  .map((p) => (
                                    <div
                                      key={p.id}
                                      onClick={() =>
                                        insertProperty(
                                          p.name,
                                          p.label || p.name
                                        )
                                      }
                                      className="px-4 py-2 text-sm hover:bg-muted cursor-pointer"
                                    >
                                      {p.label || p.name}
                                    </div>
                                  ))}
                              </div>
                            ));
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  className="flex items-center gap-1 text-muted-foreground hover:text-foreground text-xs"
                >
                  👁 Formula guidance
                </button>
              </div>
            </div>
          </div>

          {/* Sample output */}
          <div className="border rounded-md p-3 flex justify-between items-center text-sm">
            <span className="text-muted-foreground">
              Sample output: --
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                className="text-muted-foreground underline text-xs"
              >
                Show properties
              </button>
              <button
                type="button"
                className="border rounded px-3 py-1 text-xs"
              >
                Test formula
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Time between */}
      {form.calc_property_type === "time_between" && (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1">
              Number format *
            </label>
            <input
              value="Duration"
              disabled
              className="w-full border rounded-md px-3 py-2 bg-muted text-muted-foreground text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">
              Start date *
            </label>
            <PropertySearchDropdown
              value={form.calc_start_date_property}
              onChange={(val) =>
                setForm((p) => ({
                  ...p,
                  calc_start_date_property: val,
                }))
              }
              placeholder="Search for a property"
              search={form.calc_start_date_search}
              onSearchChange={(val) =>
                setForm((p) => ({
                  ...p,
                  calc_start_date_search: val,
                }))
              }
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">
              End date *
            </label>
            <PropertySearchDropdown
              value={form.calc_end_date_property}
              onChange={(val) =>
                setForm((p) => ({
                  ...p,
                  calc_end_date_property: val,
                }))
              }
              placeholder="Search for a property"
              search={form.calc_end_date_search}
              onSearchChange={(val) =>
                setForm((p) => ({
                  ...p,
                  calc_end_date_search: val,
                }))
              }
            />
          </div>
        </div>
      )}

      {/* Time since */}
      {form.calc_property_type === "time_since" && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium block mb-1">
              Start date *
            </label>
            <PropertySearchDropdown
              value={form.calc_start_date_property}
              onChange={(val) =>
                setForm((p) => ({
                  ...p,
                  calc_start_date_property: val,
                }))
              }
              placeholder="Search for a property"
              search={form.calc_start_date_search}
              onSearchChange={(val) =>
                setForm((p) => ({
                  ...p,
                  calc_start_date_search: val,
                }))
              }
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">
              End date
            </label>
            <input
              value="Today's date"
              disabled
              className="w-full border rounded-md px-3 py-2 bg-muted text-muted-foreground text-sm"
            />
          </div>
        </div>
      )}

      {/* Time until */}
      {form.calc_property_type === "time_until" && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium block mb-1">
              Start date
            </label>
            <input
              value="Today's date"
              disabled
              className="w-full border rounded-md px-3 py-2 bg-muted text-muted-foreground text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">
              End date *
            </label>
            <PropertySearchDropdown
              value={form.calc_end_date_property}
              onChange={(val) =>
                setForm((p) => ({
                  ...p,
                  calc_end_date_property: val,
                }))
              }
              placeholder="Search for a property"
              search={form.calc_end_date_search}
              onSearchChange={(val) =>
                setForm((p) => ({
                  ...p,
                  calc_end_date_search: val,
                }))
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}
