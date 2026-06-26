// Область: сайдбар, навигация, список встреч.
import type { Dict } from "../types";

export const en: Dict = {
  // Navigation / tooltips
  "sidebar.home": "Home",
  "sidebar.newMeeting": "New Meeting",
  "sidebar.settings": "Settings",
  "sidebar.about": "About",
  "sidebar.meetingNotes": "My Meetings",
  "sidebar.importAudio": "Import Audio",
  "sidebar.startRecording": "Start Recording",
  "sidebar.recordingInProgress": "Recording in progress...",

  // Search
  "sidebar.searchPlaceholder": "Search meeting content...",
  "sidebar.searching": "Searching...",
  "sidebar.matchLabel": "Match:",

  // Default meeting / call
  "sidebar.newCall": "+ New Call",

  // Item actions (aria-labels)
  "sidebar.editMeetingTitleAria": "Edit meeting title",
  "sidebar.deleteMeetingAria": "Delete meeting",

  // Delete confirmation
  "sidebar.deleteConfirmText": "Are you sure you want to delete this meeting? This action cannot be undone.",

  // Delete toasts
  "sidebar.deleteSuccessTitle": "Meeting deleted successfully",
  "sidebar.deleteSuccessDesc": "All associated data has been removed",
  "sidebar.deleteErrorTitle": "Failed to delete meeting",

  // Edit modal
  "sidebar.editModalTitle": "Edit Meeting Title",
  "sidebar.meetingTitleLabel": "Meeting Title",
  "sidebar.meetingTitlePlaceholder": "Enter meeting title",
  "sidebar.cancel": "Cancel",
  "sidebar.save": "Save",

  // Edit toasts
  "sidebar.editEmptyError": "Meeting title cannot be empty",
  "sidebar.editSuccess": "Meeting title updated successfully",
  "sidebar.editErrorTitle": "Failed to update meeting title",
};

export const ru: Dict = {
  // Navigation / tooltips
  "sidebar.home": "Главная",
  "sidebar.newMeeting": "Новая встреча",
  "sidebar.settings": "Настройки",
  "sidebar.about": "О программе",
  "sidebar.meetingNotes": "Мои встречи",
  "sidebar.importAudio": "Импорт аудио",
  "sidebar.startRecording": "Начать запись",
  "sidebar.recordingInProgress": "Идёт запись...",

  // Search
  "sidebar.searchPlaceholder": "Поиск по содержимому встреч...",
  "sidebar.searching": "Поиск...",
  "sidebar.matchLabel": "Совпадение:",

  // Default meeting / call
  "sidebar.newCall": "+ Новый звонок",

  // Item actions (aria-labels)
  "sidebar.editMeetingTitleAria": "Изменить название встречи",
  "sidebar.deleteMeetingAria": "Удалить встречу",

  // Delete confirmation
  "sidebar.deleteConfirmText": "Вы уверены, что хотите удалить эту встречу? Это действие нельзя отменить.",

  // Delete toasts
  "sidebar.deleteSuccessTitle": "Встреча удалена",
  "sidebar.deleteSuccessDesc": "Все связанные данные удалены",
  "sidebar.deleteErrorTitle": "Не удалось удалить встречу",

  // Edit modal
  "sidebar.editModalTitle": "Изменить название встречи",
  "sidebar.meetingTitleLabel": "Название встречи",
  "sidebar.meetingTitlePlaceholder": "Введите название встречи",
  "sidebar.cancel": "Отмена",
  "sidebar.save": "Сохранить",

  // Edit toasts
  "sidebar.editEmptyError": "Название встречи не может быть пустым",
  "sidebar.editSuccess": "Название встречи обновлено",
  "sidebar.editErrorTitle": "Не удалось обновить название встречи",
};
