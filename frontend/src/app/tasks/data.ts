export interface Task {
  id: string
  title: string
  assignedTo: {
    name: string
    avatar?: string
  }
  dueDate: string
  type: "Call" | "Email" | "To-do"
  queue: string
  status: "Completed" | "Pending"
  priority?: "High" | "Medium" | "Low"
}

export const tasks: Task[] = [
  // Empty for now to match screenshot "0 records"
]

export const TASK_OWNERS = ["Mahmoud Ali", "Mohamed El-Atifi", "Abdelwahab", "Abdelrahman Badawy"]
export const TASK_TYPES = ["Call", "Email", "To-do"]
export const TASK_QUEUES = ["General", "Support", "Sales"]
