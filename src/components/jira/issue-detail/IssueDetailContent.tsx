"use client";

import React from "react";
import { IssueTitle } from "./IssueTitle";
import { IssueDetailsCard } from "./IssueDetailsCard";
import { IssueDescriptionCard } from "./IssueDescriptionCard";
import { IssueAttachmentsCard } from "./IssueAttachmentsCard";
import { IssueSubtasksCard } from "./IssueSubtasksCard";
import { IssueActivityTabs } from "./IssueActivityTabs";
import { IssueSidebar } from "./IssueSidebar";
import { useTaskDetail } from "@/hooks/useTaskDetail";

export interface IssueDetailContentProps {
  taskDetail: ReturnType<typeof useTaskDetail>;
  projectId: string;
  projectKey?: string;
  className?: string;
}

export const IssueDetailContent: React.FC<IssueDetailContentProps> = ({
  taskDetail,
  projectId,
  projectKey,
  className = "",
}) => {
  const {
    task,
    typeInfo,
    currentColumn,
    effectiveColumns,
    canChangeStatus,
    canChangeAssignee,
    currentUser,
    dictionaries,
    isClosed,
    isDone,
    resolution,
    subtasks,
    isEditingTitle,
    setIsEditingTitle,
    uploadingFile,
    aiLoading,
    aiRecommendation,
    commentInputRef,
    handleSaveTitle,
    handleSaveDescription,
    handleChangeStatus,
    handleChangeType,
    handleChangePriority,
    handleToggleComponent,
    handleToggleLabel,
    handleClosePermanently,
    handleUploadFile,
    handleToggleSubtask,
    handleDeleteSubtask,
    handleAddSubtask,
    handleAddComment,
    handleGetAiRecommendation,
    handleUpdateField,
    handleReturnToClient,
  } = taskDetail;

  if (!task || !typeInfo) return null;

  const resolvedProjectKey = projectKey || task.project?.key || "";

  return (
    <div
      className={`grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-border min-h-full ${className}`}
    >
      {/* Left Side: Content & Details (8 cols) */}
      <div className="lg:col-span-8 p-5 sm:p-6 space-y-5 sm:space-y-6">
        {/* Title block */}
        <IssueTitle
          title={task.title}
          isEditing={isEditingTitle}
          onStartEdit={() => setIsEditingTitle(true)}
          onCancelEdit={() => setIsEditingTitle(false)}
          onSaveTitle={handleSaveTitle}
        />

        {/* Details block with interactive status dropdown badge */}
        <IssueDetailsCard
          task={task}
          typeInfo={typeInfo}
          currentColumn={currentColumn}
          columns={effectiveColumns}
          canChangeStatus={canChangeStatus}
          onChangeStatus={handleChangeStatus}
          projectId={projectId}
          projectKey={resolvedProjectKey}
          dictionaries={dictionaries}
          isClosed={isClosed}
          isDone={isDone}
          resolution={resolution}
          onChangeType={handleChangeType}
          onChangePriority={handleChangePriority}
          onToggleComponent={handleToggleComponent}
          onToggleLabel={handleToggleLabel}
          onClosePermanently={handleClosePermanently}
        />

        {/* Description Block */}
        <IssueDescriptionCard
          description={task.description}
          onSaveDescription={handleSaveDescription}
        />

        {/* Attachments */}
        <IssueAttachmentsCard
          attachments={task.attachments}
          uploadingFile={uploadingFile}
          onUploadFile={handleUploadFile}
        />

        {/* Subtasks block */}
        <IssueSubtasksCard
          subtasks={subtasks}
          onToggleSubtask={handleToggleSubtask}
          onDeleteSubtask={handleDeleteSubtask}
          onAddSubtask={handleAddSubtask}
        />

        {/* Activity / Comments Block */}
        <IssueActivityTabs
          comments={task.comments}
          auditLogs={task.auditLogs}
          taskCreatedAt={task.createdAt}
          taskCreator={task.creator}
          currentUser={currentUser}
          aiRecommendation={aiRecommendation}
          aiLoading={aiLoading}
          commentInputRef={commentInputRef}
          onAddComment={handleAddComment}
          onGetAiRecommendation={handleGetAiRecommendation}
        />
      </div>

      {/* Right Side: Metadata / Jira Sidebar (4 cols) with internal time tracking */}
      <div className="lg:col-span-4 bg-card/30">
        <IssueSidebar
          task={task}
          projectId={projectId}
          canChangeAssignee={canChangeAssignee}
          currentUser={currentUser}
          onUpdateField={handleUpdateField}
          onReturnToClient={handleReturnToClient}
        />
      </div>
    </div>
  );
};
