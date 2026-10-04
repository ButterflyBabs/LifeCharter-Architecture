import type { ActionTool } from "./types";
import { CRM_TOOLS } from "./crm";
import { TASK_TOOLS } from "./tasks";
import { PIPELINE_TOOLS } from "./pipelines";
import { EMAIL_TOOLS } from "./email";
import { CONTENT_TOOLS } from "./content";
import { PAGE_TOOLS } from "./pages";
import { MEMORY_TOOLS } from "./memory";

// Everything the assistant can do. Add a tool here and every client's assistant can use it
// (always behind the same preview + Approve step for anything that changes data).
export const ACTION_TOOLS: ActionTool[] = [...CRM_TOOLS, ...TASK_TOOLS, ...PIPELINE_TOOLS, ...EMAIL_TOOLS, ...CONTENT_TOOLS, ...PAGE_TOOLS, ...MEMORY_TOOLS];

export const toolByName = (name: string) => ACTION_TOOLS.find((t) => t.name === name);

export const openAiToolDefs = () =>
  ACTION_TOOLS.map((t) => ({
    type: "function" as const,
    function: { name: t.name, description: t.description, parameters: t.parameters },
  }));
