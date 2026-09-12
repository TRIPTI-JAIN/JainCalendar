package com.jaincalendar

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews

class JainDashboardWidgetProvider : AppWidgetProvider() {

  override fun onUpdate(
      context: Context,
      appWidgetManager: AppWidgetManager,
      appWidgetIds: IntArray
  ) {
    updateWidgets(context, appWidgetManager, appWidgetIds)
  }

  override fun onEnabled(context: Context) {
    val appWidgetManager = AppWidgetManager.getInstance(context)
    val ids =
        appWidgetManager.getAppWidgetIds(
            ComponentName(context, JainDashboardWidgetProvider::class.java))
    updateWidgets(context, appWidgetManager, ids)
  }

  companion object {
    const val PREFS_NAME = "jain_dashboard_widget"
    const val KEY_CITY = "city"
    const val KEY_TITHI = "tithi"
    const val KEY_NAVKARSI = "navkarsi"
    const val KEY_FESTIVAL = "festival"
    const val KEY_FESTIVAL_DATE = "festival_date"
    const val KEY_UPDATED_AT = "updated_at"

    fun updateWidgets(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
      val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
      val city = prefs.getString(KEY_CITY, context.getString(R.string.app_name)) ?: "Jain Calendar"
      val tithi = prefs.getString(KEY_TITHI, "Open the app to load today") ?: "Open the app to load today"
      val navkarsi = prefs.getString(KEY_NAVKARSI, "—") ?: "—"
      val festival = prefs.getString(KEY_FESTIVAL, "No festival today") ?: "No festival today"
      val festivalDate = prefs.getString(KEY_FESTIVAL_DATE, "") ?: ""
      val updatedAt = prefs.getString(KEY_UPDATED_AT, "") ?: ""

      val launchIntent = Intent(context, MainActivity::class.java)
      val pendingIntent =
          PendingIntent.getActivity(
              context,
              0,
              launchIntent,
              PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)

      appWidgetIds.forEach { widgetId ->
        val views = RemoteViews(context.packageName, R.layout.jain_dashboard_widget)
        views.setTextViewText(R.id.widget_title, city)
        views.setTextViewText(R.id.widget_tithi_value, tithi)
        views.setTextViewText(R.id.widget_navkarsi_value, navkarsi)
        views.setTextViewText(R.id.widget_festival_value, festival)
        views.setTextViewText(
            R.id.widget_updated_at,
            if (festivalDate.isBlank()) updatedAt else "$festivalDate  •  $updatedAt")
        views.setOnClickPendingIntent(R.id.widget_root, pendingIntent)
        appWidgetManager.updateAppWidget(widgetId, views)
      }
    }
  }
}
