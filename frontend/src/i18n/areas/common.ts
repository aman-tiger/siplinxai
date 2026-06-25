// Область: общие/авторизация (логин, пейволл, PRO-гейт, промокод, язык).
// Уже используется компонентами auth/*. Ключи неймспейснуты по областям,
// чтобы при слиянии словарей не было коллизий.
import type { Dict } from "../types";

export const en: Dict = {
  // Язык / выбор языка
  "lang.label": "Language",

  // Экран входа
  "login.subtitle":
    "Sign in to use the app. Recording and transcription still run locally on your device.",
  "login.signIn": "Sign in with Google",
  "login.opening": "Opening browser…",
  "login.hint":
    "Sign-in opens in your system browser. Return to the app after signing in.",

  // Пейволл
  "paywall.subtitle":
    "To use the app, subscribe to PRO or activate a promo code for a free period.",
  "paywall.trial7": "7 days free, then $4/week",
  "paywall.monthly": "Get PRO for $2/week",
  "paywall.cardNote":
    "The 7-day trial requires a card. Billing starts after the trial; cancel anytime.",
  "paywall.orPromo": "or activate a promo code",
  "paywall.refresh": "Already paid — refresh",
  "paywall.logout": "Sign out ({email})",

  // PRO-гейт / кнопки
  "pro.upgrade": "Get PRO",
  "pro.busy": "Waiting for payment…",
  "pro.manage": "Manage subscription",
  "pro.featureLocked": "{feature} — PRO feature",
  "pro.featureLockedGeneric": "PRO feature",
  "pro.unlock": "Subscribe to Siplinx AI PRO to unlock.",
  "pro.orPromoLong": "or activate a promo code for a free period",

  // Поле промокода
  "promo.placeholder": "Promo code",
  "promo.activate": "Activate",
  "promo.activating": "Activating…",
  "promo.success": "Promo code activated — unlocking PRO…",
  "promo.err.invalid_code": "Invalid promo code",
  "promo.err.already_pro": "You already have an active PRO subscription",
  "promo.err.unauthorized": "Session expired, please sign in again",
  "promo.err.network": "No connection to the server",
  "promo.err.server": "Server error",

  // Общие кнопки/слова (переиспользуемые)
  "common.cancel": "Cancel",
  "common.save": "Save",
  "common.delete": "Delete",
  "common.close": "Close",
  "common.confirm": "Confirm",
  "common.back": "Back",
  "common.next": "Next",
  "common.continue": "Continue",
  "common.retry": "Retry",
  "common.loading": "Loading…",
};

export const ru: Dict = {
  "lang.label": "Язык",

  "login.subtitle":
    "Войдите, чтобы пользоваться приложением. Запись и транскрипция по-прежнему выполняются локально на вашем устройстве.",
  "login.signIn": "Войти через Google",
  "login.opening": "Открываем браузер…",
  "login.hint":
    "Вход откроется в системном браузере. После входа вернитесь в приложение.",

  "paywall.subtitle":
    "Чтобы пользоваться приложением, оформите подписку PRO или активируйте промокод на бесплатный период.",
  "paywall.trial7": "7 дней бесплатно, потом $4/неделю",
  "paywall.monthly": "Оформить PRO за $2/неделю",
  "paywall.cardNote":
    "Для триала на 7 дней нужна карта. Списание начнётся после триала, отменить можно в любой момент.",
  "paywall.orPromo": "или активируйте промокод",
  "paywall.refresh": "Я уже оплатил — обновить",
  "paywall.logout": "Выйти ({email})",

  "pro.upgrade": "Оформить PRO",
  "pro.busy": "Ждём оплату…",
  "pro.manage": "Управлять подпиской",
  "pro.featureLocked": "{feature} — функция PRO",
  "pro.featureLockedGeneric": "Функция PRO",
  "pro.unlock": "Оформите подписку Siplinx AI PRO, чтобы разблокировать.",
  "pro.orPromoLong": "или активируйте промокод на бесплатный период",

  "promo.placeholder": "Промокод",
  "promo.activate": "Активировать",
  "promo.activating": "Активируем…",
  "promo.success": "Промокод активирован — открываем PRO…",
  "promo.err.invalid_code": "Неверный промокод",
  "promo.err.already_pro": "У вас уже активна PRO-подписка",
  "promo.err.unauthorized": "Сессия истекла, войдите заново",
  "promo.err.network": "Нет связи с сервером",
  "promo.err.server": "Ошибка сервера",

  "common.cancel": "Отмена",
  "common.save": "Сохранить",
  "common.delete": "Удалить",
  "common.close": "Закрыть",
  "common.confirm": "Подтвердить",
  "common.back": "Назад",
  "common.next": "Далее",
  "common.continue": "Продолжить",
  "common.retry": "Повторить",
  "common.loading": "Загрузка…",
};
