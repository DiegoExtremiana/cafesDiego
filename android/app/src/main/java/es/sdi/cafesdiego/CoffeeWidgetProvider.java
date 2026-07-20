package es.sdi.cafesdiego;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Handler;
import android.widget.RemoteViews;
import android.widget.Toast;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.TimeZone;

/**
 * Widget de pantalla de inicio: un boton que registra un cafe llamando a la
 * MISMA API que la web (POST /rest/v1/coffees en Supabase) con el token de
 * sesion que la app espeja en Preferences. No abre la app y no duplica logica
 * de negocio: misma tabla y mismo contrato. La suscripcion realtime de la web
 * reflejara el INSERT en vivo cuando la app este abierta.
 */
public class CoffeeWidgetProvider extends AppWidgetProvider {

    private static final String ACTION_REGISTER = "es.sdi.cafesdiego.REGISTER_COFFEE";
    // Fichero SharedPreferences que usa @capacitor/preferences por defecto.
    private static final String PREFS = "CapacitorStorage";
    private static final String K_URL = "sb_url";
    private static final String K_KEY = "sb_key";
    private static final String K_ACCESS = "sb_access_token";
    private static final String K_REFRESH = "sb_refresh_token";
    private static final String K_USER = "sb_user_id";

    @Override
    public void onUpdate(Context context, AppWidgetManager mgr, int[] ids) {
        for (int id : ids) {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.coffee_widget);
            Intent intent = new Intent(context, CoffeeWidgetProvider.class);
            intent.setAction(ACTION_REGISTER);
            int flags = PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE;
            PendingIntent pi = PendingIntent.getBroadcast(context, 0, intent, flags);
            views.setOnClickPendingIntent(R.id.widget_button, pi);
            mgr.updateAppWidget(id, views);
        }
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        if (!ACTION_REGISTER.equals(intent.getAction())) return;
        // La red no puede ir en el hilo principal: goAsync + hilo de fondo.
        final PendingResult pending = goAsync();
        final Context ctx = context.getApplicationContext();
        new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    registerCoffee(ctx);
                } finally {
                    pending.finish();
                }
            }
        }).start();
    }

    private void registerCoffee(Context context) {
        SharedPreferences p = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        String url = p.getString(K_URL, null);
        String key = p.getString(K_KEY, null);
        String access = p.getString(K_ACCESS, null);
        String refresh = p.getString(K_REFRESH, null);
        String userId = p.getString(K_USER, null);
        if (url == null || key == null || access == null || userId == null) {
            toast(context, "Inicia sesion en la app primero");
            return;
        }
        int status = insert(url, key, access, userId);
        // Token caducado: refresca con el refresh_token y reintenta una vez.
        if (status == 401 && refresh != null) {
            String newAccess = refreshToken(url, key, refresh, p);
            if (newAccess != null) {
                status = insert(url, key, newAccess, userId);
            }
        }
        toast(context, (status >= 200 && status < 300) ? "Cafe registrado" : "Error (" + status + ")");
    }

    private int insert(String url, String key, String access, String userId) {
        HttpURLConnection conn = null;
        try {
            conn = (HttpURLConnection) new URL(url + "/rest/v1/coffees").openConnection();
            conn.setRequestMethod("POST");
            conn.setDoOutput(true);
            conn.setRequestProperty("apikey", key);
            conn.setRequestProperty("Authorization", "Bearer " + access);
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setRequestProperty("Prefer", "return=minimal");
            SimpleDateFormat fmt = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US);
            fmt.setTimeZone(TimeZone.getTimeZone("UTC"));
            String body = new JSONObject()
                    .put("user_id", userId)
                    .put("taken_at", fmt.format(new Date()))
                    .toString();
            OutputStream os = conn.getOutputStream();
            os.write(body.getBytes("UTF-8"));
            os.close();
            return conn.getResponseCode();
        } catch (Exception e) {
            return -1;
        } finally {
            if (conn != null) conn.disconnect();
        }
    }

    private String refreshToken(String url, String key, String refresh, SharedPreferences p) {
        HttpURLConnection conn = null;
        try {
            conn = (HttpURLConnection) new URL(url + "/auth/v1/token?grant_type=refresh_token").openConnection();
            conn.setRequestMethod("POST");
            conn.setDoOutput(true);
            conn.setRequestProperty("apikey", key);
            conn.setRequestProperty("Content-Type", "application/json");
            String body = new JSONObject().put("refresh_token", refresh).toString();
            OutputStream os = conn.getOutputStream();
            os.write(body.getBytes("UTF-8"));
            os.close();
            int code = conn.getResponseCode();
            if (code < 200 || code >= 300) return null;
            BufferedReader br = new BufferedReader(new InputStreamReader(conn.getInputStream(), "UTF-8"));
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = br.readLine()) != null) sb.append(line);
            br.close();
            JSONObject res = new JSONObject(sb.toString());
            String newAccess = res.getString("access_token");
            String newRefresh = res.optString("refresh_token", refresh);
            p.edit().putString(K_ACCESS, newAccess).putString(K_REFRESH, newRefresh).apply();
            return newAccess;
        } catch (Exception e) {
            return null;
        } finally {
            if (conn != null) conn.disconnect();
        }
    }

    private void toast(final Context context, final String msg) {
        new Handler(context.getMainLooper()).post(new Runnable() {
            @Override
            public void run() {
                Toast.makeText(context, msg, Toast.LENGTH_SHORT).show();
            }
        });
    }
}
