import React from "react";
import { ColumnItem } from "@/components/board/ColumnCard";

export interface JiraCreateIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName?: string;
  projectKey?: string;
  columns: ColumnItem[];
  allProjects?: Array<{ id: string; name: string; key: string }>;
  currentUser?: any;
  onIssueCreated: (createdTask: any) => void;
}

export interface DropdownOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  isHeader?: boolean;
}
