package com.jaincalendar

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap

class DashboardWidgetModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

  private fun stringOrDefault(data: ReadableMap, key: String, fallback: String): String {
    return if (data.hasKey(key) && !data.isNull(key)) {
      data.getString(key) ?: fallback
    } else {
      fallback
    }
  }

  override fun getName(): String = "DashboardWidget"

  @ReactMethod
  fun updateWidgetData(data: ReadableMap) {
    val prefs =
        reactApplicationContext.getSharedPreferences(
            JainDashboardWidgetProvider.PREFS_NAME,
            Context.MODE_PRIVATE)

    prefs.edit()
        .putString(
            JainDashboardWidgetProvider.KEY_CITY,
            stringOrDefault(data, "cityName", "Jain Calendar"))
        .putString(
            JainDashboardWidgetProvider.KEY_TITHI,
            stringOrDefault(data, "tithi", "—"))
        .putString(
            JainDashboardWidgetProvider.KEY_NAVKARSI,
            stringOrDefault(data, "navkarsiTime", "—"))
        .putString(
            JainDashboardWidgetProvider.KEY_FESTIVAL,
            stringOrDefault(data, "festivalTitle", "No festival today"))
        .putString(
            JainDashboardWidgetProvider.KEY_FESTIVAL_DATE,
            stringOrDefault(data, "festivalDate", ""))
        .putString(
            JainDashboardWidgetProvider.KEY_UPDATED_AT,
            stringOrDefault(data, "updatedAt", ""))
        .apply()

    val appWidgetManager = AppWidgetManager.getInstance(reactApplicationContext)
    val ids =
        appWidgetManager.getAppWidgetIds(
            ComponentName(reactApplicationContext, JainDashboardWidgetProvider::class.java))

    JainDashboardWidgetProvider.updateWidgets(reactApplicationContext, appWidgetManager, ids)
  }
}
