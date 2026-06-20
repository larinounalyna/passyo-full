"use client";
import React, { useState, useEffect, useCallback } from "react";
import HeadingSection from "./DailyPlanningComponents/jsx/HeadingSection";
import TimeChart from "./DailyPlanningComponents/jsx/TimeChart";
import ToDoCards from "./DailyPlanningComponents/jsx/ToDocards";
import DoneTaskCard from "./DailyPlanningComponents/jsx/DoneCards";
import InProgressCard from "./DailyPlanningComponents/jsx/InProgressCards";
import "./DailyPlanning.css";
import PageSection from "@/components/page_section/page_section";
import { X, Calendar as CalendarIcon, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { useProject } from "@/lib/context/ProjectContext";
import { apiRequest } from "@/lib/api/client";
import { getMe, UserOut } from "@/lib/api/auth";

interface Task {
  id: number;
  title: string;
  description?: string;
  status_id: number;
  assigned_to?: number;
  start_date?: string;
  end_date?: string;
}

export default function DailyPlanning() {
  const { project } = useProject();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentUser, setCurrentUser] = useState<UserOut | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskStatus, setTaskStatus] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);

  const [taskData, setTaskData] = useState({
    title: "",
    description: "",
    assigned_to: "",
    category: "General",
  });

  const fetchCurrentUser = useCallback(async () => {
    try {
      const user = await getMe();
      setCurrentUser(user);
    } catch (err) {
      console.error("Failed to fetch current user:", err);
    }
  }, []);

  const fetchTasks = useCallback(async () => {
    if (!project) return;
    try {
      setIsLoadingTasks(true);
      const data = await apiRequest<Task[]>(`/tasks/project/${project.id}`);
      setTasks(data);
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
    } finally {
      setIsLoadingTasks(false);
    }
  }, [project]);

  useEffect(() => {
    fetchTasks();
    fetchCurrentUser();
  }, [fetchTasks, fetchCurrentUser]);

  const handleOpenModal = (statusId: number) => {
    setTaskStatus(statusId);
    setShowTaskModal(true);
  };

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !taskStatus) return;

    const today = new Date().toISOString().split("T")[0];
    setIsSubmitting(true);
    try {
      await apiRequest("/tasks", {
        method: "POST",
        body: {
          title: taskData.title,
          description: taskData.description,
          assigned_to: parseInt(taskData.assigned_to) || null,
          start_date: today,
          end_date: today,
          category: taskData.category,
          status_id: taskStatus,
          project_id: project.id,
        },
      });

      toast.success("Task added successfully!");
      setShowTaskModal(false);
      setTaskData({
        title: "",
        description: "",
        assigned_to: "",
        category: "General",
      });
      fetchTasks();
    } catch (err: any) {
      toast.error(err.message || "Failed to add task");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMoveTask = async (taskId: number, currentStatus: number) => {
    if (currentStatus >= 4) return; // Already Done
    const nextStatus = currentStatus + 1;
    try {
      await apiRequest(`/tasks/${taskId}`, {
        method: "PATCH",
        body: { status_id: nextStatus },
      });
      toast.success("Task moved!");
      fetchTasks();
    } catch (err: any) {
      toast.error(err.message || "Failed to move task");
    }
  };

  const tasksByStatus = (statusId: number) =>
    tasks.filter((t) => t.status_id === statusId);

  return (
    <div className="daily-planning-page">
      <HeadingSection />
      <TimeChart />

      <div className="board-heading">
        <PageSection sectionName="Project Tasks" />
      </div>

      {isLoadingTasks ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="kanban-board">
          {/* New Column */}
          <div className="kanban-column">
            <div className="column-header">
              <h3>New</h3>
              <span className="count">{tasksByStatus(1).length}</span>
            </div>
            <div className="column-content">
              {tasksByStatus(1).map((task) => (
                <ToDoCards
                  key={task.id}
                  wo={`#T-${task.id}`}
                  title={task.title}
                  description={task.description}
                  badge="NEW"
                  onMove={() => handleMoveTask(task.id, 1)}
                  moveLabel="Start Work"
                />
              ))}
              <div className="add-task-row">
                <button
                  type="button"
                  className="add-task-btn"
                  onClick={() => handleOpenModal(1)}
                >
                  + Add Task
                </button>
              </div>
            </div>
          </div>

          {/* In Progress Column */}
          <div className="kanban-column">
            <div className="column-header">
              <h3>In progress</h3>
              <span className="count">{tasksByStatus(2).length}</span>
            </div>
            <div className="column-content">
              {tasksByStatus(2).map((task) => (
                <InProgressCard
                  key={task.id}
                  wo={`#T-${task.id}`}
                  title={task.title}
                  description={task.description}
                  onMove={() => handleMoveTask(task.id, 2)}
                  moveLabel="Send to Review"
                />
              ))}
            </div>
          </div>

          {/* Review Column */}
          <div className="kanban-column">
            <div className="column-header">
              <h3>Review</h3>
              <span className="count">{tasksByStatus(3).length}</span>
            </div>
            <div className="column-content">
              {tasksByStatus(3).map((task) => (
                <ToDoCards
                  key={task.id}
                  wo={`#T-${task.id}`}
                  title={task.title}
                  description={task.description}
                  badge="REVIEW"
                  onMove={() => handleMoveTask(task.id, 3)}
                  moveLabel="Approve"
                />
              ))}
            </div>
          </div>

          {/* Done Column */}
          <div className="kanban-column">
            <div className="column-header">
              <h3>Done</h3>
              <span className="count">{tasksByStatus(4).length}</span>
            </div>
            <div className="column-content">
              {tasksByStatus(4).map((task) => (
                <DoneTaskCard
                  key={task.id}
                  wo={`#T-${task.id}`}
                  title={task.title}
                  subtitle={task.description}
                  status="COMPLETED"
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {showTaskModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-[500px] max-w-[90vw] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Add New Task</h2>
              <button
                onClick={() => setShowTaskModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleTaskSubmit}
              className="p-6 flex flex-col gap-5"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Task Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Pour Concrete on L4"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  value={taskData.title}
                  onChange={(e) =>
                    setTaskData({ ...taskData, title: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer"
                  value={taskData.category}
                  onChange={(e) =>
                    setTaskData({ ...taskData, category: e.target.value })
                  }
                >
                  <option value="General">General</option>
                  <option value="Structural">Structural</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Plumbing">Plumbing</option>
                  <option value="HVAC">HVAC</option>
                  <option value="Finishing">Finishing</option>
                  <option value="Site Work">Site Work</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Additional details..."
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                  value={taskData.description}
                  onChange={(e) =>
                    setTaskData({ ...taskData, description: e.target.value })
                  }
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                  <UserIcon size={16} className="text-gray-500" />
                  Assignee
                </label>
                <select
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer"
                  value={taskData.assigned_to}
                  onChange={(e) =>
                    setTaskData({ ...taskData, assigned_to: e.target.value })
                  }
                >
                  <option value="">Unassigned</option>
                  {currentUser && (
                    <option value={currentUser.id}>
                      Assign to Me ({currentUser.name})
                    </option>
                  )}
                  {(project?.members ?? [])
                    .filter((m) => m.user_id !== currentUser?.id)
                    .map((member) => (
                      <option key={member.user_id} value={member.user_id}>
                        {member.name} {member.family_name} (@{member.username})
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 focus:ring-4 focus:ring-blue-100 transition-all shadow-sm disabled:opacity-70 flex items-center justify-center min-w-[120px]"
                >
                  {isSubmitting ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  ) : (
                    "Save Task"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
