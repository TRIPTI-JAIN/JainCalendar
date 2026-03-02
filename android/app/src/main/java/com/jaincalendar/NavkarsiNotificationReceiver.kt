package com.jaincalendar

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat

class NavkarsiNotificationReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val channelId = "navkarsi_reminder_channel"
    val title = intent.getStringExtra("title") ?: "Navkarsi Reminder"
    val body = intent.getStringExtra("body") ?: "Navkarsi time has started."

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val channel = NotificationChannel(
          channelId,
          "Navkarsi Reminders",
          NotificationManager.IMPORTANCE_DEFAULT
      ).apply {
        description = "Daily reminder for Navkarsi time"
      }

      val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
      manager.createNotificationChannel(channel)
    }

    val notification = NotificationCompat.Builder(context, channelId)
        .setSmallIcon(R.mipmap.ic_launcher)
        .setContentTitle(title)
        .setContentText(body)
        .setPriority(NotificationCompat.PRIORITY_DEFAULT)
        .setAutoCancel(true)
        .build()

    val notificationId = System.currentTimeMillis().toInt()
    try {
      NotificationManagerCompat.from(context).notify(notificationId, notification)
    } catch (_: SecurityException) {
      // Notification permission may be revoked between scheduling and trigger time.
    }
  }
}
