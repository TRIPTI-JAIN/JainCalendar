package com.jaincalendar

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class NavkarsiNotificationModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "NavkarsiNotification"

  @ReactMethod
  fun scheduleNotification(triggerAtMillis: Double, title: String, body: String) {
    val context = reactApplicationContext
    val triggerTime = triggerAtMillis.toLong()
    if (triggerTime <= 0L) return

    val intent = Intent(context, NavkarsiNotificationReceiver::class.java).apply {
      putExtra("title", title)
      putExtra("body", body)
    }

    val requestCode = (triggerTime % Int.MAX_VALUE).toInt()
    val pendingIntent = PendingIntent.getBroadcast(
        context,
        requestCode,
        intent,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)

    val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
    alarmManager.setAndAllowWhileIdle(
        AlarmManager.RTC_WAKEUP,
        triggerTime,
        pendingIntent
    )
  }
}
