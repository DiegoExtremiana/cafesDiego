package es.sdi.cafesdiego

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.os.Handler
import android.widget.RemoteViews
import android.widget.Toast
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

/**
 * Widget de pantalla de inicio: un botón que registra un café llamando a la
 * MISMA API que la web (POST /rest/v1/coffees en Supabase) con el token de
 * sesión que la app espeja en Preferences. No duplica lógica de negocio: usa
 * la misma tabla y contrato. La suscripción realtime de la web reflejará el
 * INSERT en vivo cuando la app esté abierta.
 */
class CoffeeWidgetProvider : AppWidgetProvider() {

    companion object {
        private const val ACTION_REGISTER = "es.sdi.cafesdiego.REGISTER_COFFEE"
        // Fichero SharedPreferences que usa @capacitor/preferences por defecto.
        private const val PREFS = "CapacitorStorage"
        private const val K_URL = "sb_url"
        private const val K_KEY = "sb_key"
        private const val K_ACCESS = "sb_access_token"
        private const val K_REFRESH = "sb_refresh_token"
        private const val K_USER = "sb_user_id"
    }

    override fun onUpdate(context: Context, mgr: AppWidgetManager, ids: IntArray) {
        for (id in ids) {
            val views = RemoteViews(context.packageName, R.layout.coffee_widget)
            val intent = Intent(context, CoffeeWidgetProvider::class.java).apply {
                action = ACTION_REGISTER
            }
            val flags = PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            val pi = PendingIntent.getBroadcast(context, 0, intent, flags)
            views.setOnClickPendingIntent(R.id.widget_button, pi)
            mgr.updateAppWidget(id, views)
        }
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        if (intent.action != ACTION_REGISTER) return
        // La red no puede ir en el hilo principal: goAsync + hilo de fondo.
        val pending = goAsync()
        Thread {
            try {
                registerCoffee(context)
            } finally {
                pending.finish()
            }
        }.start()
    }

    private fun registerCoffee(context: Context) {
        val p = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val url = p.getString(K_URL, null)
        val key = p.getString(K_KEY, null)
        var access = p.getString(K_ACCESS, null)
        val refresh = p.getString(K_REFRESH, null)
        val userId = p.getString(K_USER, null)
        if (url == null || key == null || access == null || userId == null) {
            toast(context, "Inicia sesión en la app primero")
            return
        }
        var status = insert(url, key, access, userId)
        // Token caducado: refresca con el refresh_token y reintenta una vez.
        if (status == 401 && refresh != null) {
            val newAccess = refreshToken(url, key, refresh, p)
            if (newAccess != null) {
                access = newAccess
                status = insert(url, key, access, userId)
            }
        }
        toast(context, if (status in 200..299) "Cafe registrado" else "Error ($status)")
    }

    private fun insert(url: String, key: String, access: String, userId: String): Int {
        val conn = URL("$url/rest/v1/coffees").openConnection() as HttpURLConnection
        return try {
            conn.requestMethod = "POST"
            conn.doOutput = true
            conn.setRequestProperty("apikey", key)
            conn.setRequestProperty("Authorization", "Bearer $access")
            conn.setRequestProperty("Content-Type", "application/json")
            conn.setRequestProperty("Prefer", "return=minimal")
            val iso = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US).apply {
                timeZone = TimeZone.getTimeZone("UTC")
            }.format(Date())
            val body = JSONObject().put("user_id", userId).put("taken_at", iso).toString()
            conn.outputStream.use { it.write(body.toByteArray()) }
            conn.responseCode
        } catch (e: Exception) {
            -1
        } finally {
            conn.disconnect()
        }
    }

    private fun refreshToken(
        url: String,
        key: String,
        refresh: String,
        p: SharedPreferences,
    ): String? {
        val conn = URL("$url/auth/v1/token?grant_type=refresh_token")
            .openConnection() as HttpURLConnection
        return try {
            conn.requestMethod = "POST"
            conn.doOutput = true
            conn.setRequestProperty("apikey", key)
            conn.setRequestProperty("Content-Type", "application/json")
            val body = JSONObject().put("refresh_token", refresh).toString()
            conn.outputStream.use { it.write(body.toByteArray()) }
            if (conn.responseCode !in 200..299) return null
            val res = JSONObject(conn.inputStream.bufferedReader().readText())
            val newAccess = res.getString("access_token")
            val newRefresh = res.optString("refresh_token", refresh)
            p.edit().putString(K_ACCESS, newAccess).putString(K_REFRESH, newRefresh).apply()
            newAccess
        } catch (e: Exception) {
            null
        } finally {
            conn.disconnect()
        }
    }

    private fun toast(context: Context, msg: String) {
        Handler(context.mainLooper).post {
            Toast.makeText(context, msg, Toast.LENGTH_SHORT).show()
        }
    }
}
