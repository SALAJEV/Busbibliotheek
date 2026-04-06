package be.salajev.busbibliotheek95

import android.Manifest
import android.app.Activity
import android.app.DownloadManager
import android.content.Context
import android.content.Intent
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.provider.Settings
import android.view.View
import android.webkit.*
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.view.WindowCompat
import androidx.webkit.WebSettingsCompat
import androidx.webkit.WebViewFeature
import be.salajev.busbibliotheek95.ui.theme.Busbibliotheek95Theme
import java.io.File
import java.io.FileOutputStream

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            Busbibliotheek95Theme {
                val context = LocalContext.current
                var isNetworkAvailable by remember { mutableStateOf(isNetworkAvailable(context)) }
                val isDarkTheme = isSystemInDarkTheme()
                
                val permissionsToRequest = mutableListOf(
                    Manifest.permission.ACCESS_FINE_LOCATION,
                    Manifest.permission.ACCESS_COARSE_LOCATION
                ).apply {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                        add(Manifest.permission.POST_NOTIFICATIONS)
                    }
                }

                val launcher = rememberLauncherForActivityResult(
                    ActivityResultContracts.RequestMultiplePermissions()
                ) { _ -> }

                LaunchedEffect(Unit) {
                    launcher.launch(permissionsToRequest.toTypedArray())
                }

                val siteColor = if (isDarkTheme) Color(0xFF121212) else Color(0xFFFFFFFF)
                
                remember(isDarkTheme) {
                    val window = (context as Activity).window
                    @Suppress("DEPRECATION")
                    window.statusBarColor = siteColor.toArgb()
                    WindowCompat.getInsetsController(window, window.decorView).apply {
                        isAppearanceLightStatusBars = !isDarkTheme
                    }
                }

                Scaffold(
                    modifier = Modifier.fillMaxSize(),
                    containerColor = siteColor
                ) { innerPadding ->
                    if (isNetworkAvailable) {
                        WebViewScreen(
                            url = "https://busbibliotheek95.pages.dev/",
                            modifier = Modifier.padding(innerPadding),
                            siteColor = siteColor,
                            onNetworkError = { isNetworkAvailable = false }
                        )
                    } else {
                        NoInternetDialog(
                            onRetry = { isNetworkAvailable = isNetworkAvailable(context) },
                            onOpenSettings = { startActivity(Intent(Settings.ACTION_WIFI_SETTINGS)) }
                        )
                    }
                }
            }
        }
    }

    private fun isNetworkAvailable(context: Context): Boolean {
        val connectivityManager = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val network = connectivityManager.activeNetwork ?: return false
            val activeNetwork = connectivityManager.getNetworkCapabilities(network) ?: return false
            return activeNetwork.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) ||
                    activeNetwork.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) ||
                    activeNetwork.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET)
        } else {
            @Suppress("DEPRECATION")
            val networkInfo = connectivityManager.activeNetworkInfo
            return networkInfo != null && networkInfo.isConnected
        }
    }
}

@Composable
fun WebViewScreen(url: String, modifier: Modifier = Modifier, siteColor: Color, onNetworkError: () -> Unit) {
    var webView: WebView? by remember { mutableStateOf(null) }
    val isDarkTheme = isSystemInDarkTheme()
    val context = LocalContext.current
    val leavingAppMessage = stringResource(id = R.string.leaving_app)
    
    var progress by remember { mutableFloatStateOf(0f) }
    var lastBackPressTime by remember { mutableLongStateOf(0L) }

    var filePathCallback: ValueCallback<Array<Uri>>? by remember { mutableStateOf(null) }
    val fileChooserLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        filePathCallback?.onReceiveValue(uri?.let { arrayOf(it) })
        filePathCallback = null
    }

    BackHandler {
        if (webView?.canGoBack() == true) {
            webView?.goBack()
        } else {
            val currentTime = System.currentTimeMillis()
            if (currentTime - lastBackPressTime < 2000) {
                (context as Activity).finish()
            } else {
                lastBackPressTime = currentTime
                Toast.makeText(context, context.getString(R.string.exit_toast), Toast.LENGTH_SHORT).show()
            }
        }
    }

    Box(modifier = modifier.fillMaxSize()) {
        AndroidView(
            factory = { ctx ->
                WebView(ctx).apply {
                    setBackgroundColor(siteColor.toArgb())
                    isVerticalScrollBarEnabled = false
                    isHorizontalScrollBarEnabled = false
                    overScrollMode = View.OVER_SCROLL_NEVER
                    
                    CookieManager.getInstance().setAcceptCookie(true)
                    CookieManager.getInstance().setAcceptThirdPartyCookies(this, true)
                    
                    settings.apply {
                        @Suppress("SetJavaScriptEnabled")
                        javaScriptEnabled = true
                        domStorageEnabled = true
                        
                        // Cache optimalisatie: Gebruik alleen wat echt nodig is
                        cacheMode = WebSettings.LOAD_DEFAULT
                        
                        loadWithOverviewMode = true
                        useWideViewPort = true
                        setSupportZoom(false)
                        builtInZoomControls = false
                        displayZoomControls = false
                        mediaPlaybackRequiresUserGesture = false
                        setGeolocationEnabled(true)
                        
                        val locale = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                            ctx.resources.configuration.locales[0]
                        } else {
                            @Suppress("DEPRECATION")
                            ctx.resources.configuration.locale
                        }
                        userAgentString = "$userAgentString Language/${locale?.language}"
                    }
                    
                    addJavascriptInterface(object {
                        @JavascriptInterface
                        fun processDownload(base64Data: String, contentType: String) {
                            try {
                                val pureBase64 = base64Data.substringAfter("base64,")
                                val pdfAsBytes = android.util.Base64.decode(pureBase64, android.util.Base64.DEFAULT)
                                val fileName = "Busfiche_${System.currentTimeMillis()}.pdf"
                                val path = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
                                val file = File(path, fileName)
                                FileOutputStream(file).use { it.write(pdfAsBytes) }
                                
                                val dm = context.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
                                @Suppress("DEPRECATION")
                                dm.addCompletedDownload(fileName, fileName, true, contentType, file.absolutePath, pdfAsBytes.size.toLong(), true)
                                
                                (context as Activity).runOnUiThread {
                                    Toast.makeText(context, context.getString(R.string.download_started), Toast.LENGTH_SHORT).show()
                                }
                            } catch (e: Exception) {
                                (context as Activity).runOnUiThread {
                                    Toast.makeText(context, context.getString(R.string.download_failed), Toast.LENGTH_SHORT).show()
                                }
                            }
                        }
                    }, "Android")

                    isLongClickable = false
                    setOnLongClickListener { true }

                    updateDarkMode(this, isDarkTheme)
                    
                    webChromeClient = object : WebChromeClient() {
                        override fun onProgressChanged(view: WebView?, newProgress: Int) {
                            progress = newProgress / 100f
                        }

                        override fun onGeolocationPermissionsShowPrompt(origin: String?, callback: GeolocationPermissions.Callback?) {
                            callback?.invoke(origin, true, false)
                        }

                        override fun onShowFileChooser(webView: WebView?, filePathCallbackIn: ValueCallback<Array<Uri>>?, fileChooserParams: FileChooserParams?): Boolean {
                            filePathCallback?.onReceiveValue(null)
                            filePathCallback = filePathCallbackIn
                            fileChooserLauncher.launch("*/*")
                            return true
                        }
                    }

                    setDownloadListener { downloadUrl, userAgent, contentDisposition, mimetype, _ ->
                        if (downloadUrl.startsWith("blob:")) {
                            loadUrl("javascript:(function(){" +
                                    "var xhr = new XMLHttpRequest();" +
                                    "xhr.open('GET', '$downloadUrl', true);" +
                                    "xhr.responseType = 'blob';" +
                                    "xhr.onload = function(e) {" +
                                    "  if (this.status == 200) {" +
                                    "    var reader = new FileReader();" +
                                    "    reader.readAsDataURL(this.response);" +
                                    "    reader.onloadend = function() { Android.processDownload(reader.result, '$mimetype'); }" +
                                    "  }" +
                                    "};" +
                                    "xhr.send();" +
                                    "})()")
                            return@setDownloadListener
                        }

                        val fileName = URLUtil.guessFileName(downloadUrl, contentDisposition, mimetype)
                        android.app.AlertDialog.Builder(context)
                            .setTitle(context.getString(R.string.download_title))
                            .setMessage(context.getString(R.string.download_message, fileName))
                            .setPositiveButton(context.getString(R.string.download_button)) { _, _ ->
                                try {
                                    val request = DownloadManager.Request(Uri.parse(downloadUrl))
                                    request.setMimeType(mimetype)
                                    val cookies = CookieManager.getInstance().getCookie(downloadUrl)
                                    request.addRequestHeader("cookie", cookies)
                                    request.addRequestHeader("User-Agent", userAgent)
                                    request.setTitle(fileName)
                                    request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                                    request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, fileName)
                                    val dm = context.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
                                    dm.enqueue(request)
                                    Toast.makeText(context, context.getString(R.string.download_started), Toast.LENGTH_SHORT).show()
                                } catch (e: Exception) {
                                    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(downloadUrl))
                                    context.startActivity(intent)
                                }
                            }
                            .setNegativeButton(context.getString(R.string.cancel), null)
                            .show()
                    }

                    webViewClient = object : WebViewClient() {
                        override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                            val uri = request?.url ?: return false
                            val urlString = uri.toString()
                            val host = uri.host ?: ""
                            val mainDomain = "busbibliotheek95.pages.dev"
                            
                            if (urlString.startsWith("tel:") || urlString.startsWith("mailto:") || urlString.startsWith("whatsapp:")) {
                                try {
                                    context.startActivity(Intent(Intent.ACTION_VIEW, uri))
                                    return true
                                } catch (e: Exception) { return false }
                            }

                            // De Lijn specifieke links (app of website)
                            if (host.contains("delijn.be") || urlString.contains("delijn://")) {
                                try {
                                    val intent = Intent(Intent.ACTION_VIEW, uri)
                                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                                    context.startActivity(intent)
                                    return true
                                } catch (e: Exception) {
                                    // Als de app niet bestaat, open in browser (behalve als het een app-schema is)
                                    if (urlString.startsWith("delijn://")) return true 
                                }
                            }
                            
                            if (host.isNotEmpty() && !host.endsWith(mainDomain)) {
                                Toast.makeText(context, leavingAppMessage, Toast.LENGTH_SHORT).show()
                                try { context.startActivity(Intent(Intent.ACTION_VIEW, uri)) } catch (e: Exception) {}
                                return true
                            }
                            return false
                        }

                        override fun onPageFinished(view: WebView?, url: String?) {
                            super.onPageFinished(view, url)
                            val theme = if (isDarkTheme) "dark" else "light"
                            view?.loadUrl("javascript:(function() { " +
                                    "var style = document.createElement('style');" +
                                    "style.innerHTML = '*{ -webkit-user-select: none; -webkit-touch-callout: none; -webkit-tap-highlight-color: transparent; outline: none; }';" +
                                    "document.head.appendChild(style);" +
                                    // De cruciale fix voor de browser engine:
                                    "var meta = document.createElement('meta');" +
                                    "meta.name = 'color-scheme';" +
                                    "meta.content = 'dark light';" +
                                    "document.head.appendChild(meta);" +
                                    "if(typeof setTheme === 'function') { setTheme('$theme'); }" +
                                    "})()")
                        }

                        override fun onReceivedError(view: WebView?, request: WebResourceRequest?, error: WebResourceError?) {
                            if (request?.isForMainFrame == true) onNetworkError()
                        }
                    }
                    loadUrl(url)
                    webView = this
                }
            },
            modifier = Modifier.fillMaxSize(),
            update = { view -> 
                updateDarkMode(view, isDarkTheme)
                // Stuur thema-update direct naar JS als het systeemthema verandert
                view.evaluateJavascript("if(typeof setTheme === 'function') { setTheme('${if (isDarkTheme) "dark" else "light"}'); }", null)
            }
        )

        if (progress < 1.0f) {
            LinearProgressIndicator(
                progress = { progress },
                modifier = Modifier.fillMaxWidth().height(2.dp).align(Alignment.TopCenter),
                color = if (isDarkTheme) Color.White else Color(0xFF2196F3),
                trackColor = Color.Transparent,
            )
        }
    }
}

private fun updateDarkMode(webView: WebView, isDarkTheme: Boolean) {
    if (WebViewFeature.isFeatureSupported(WebViewFeature.ALGORITHMIC_DARKENING)) {
        WebSettingsCompat.setAlgorithmicDarkeningAllowed(webView.settings, false)
    }
    if (WebViewFeature.isFeatureSupported(WebViewFeature.FORCE_DARK)) {
        WebSettingsCompat.setForceDark(webView.settings, WebSettingsCompat.FORCE_DARK_OFF)
    }
    
    val color = if (isDarkTheme) android.graphics.Color.parseColor("#121212") else android.graphics.Color.WHITE
    webView.setBackgroundColor(color)
    
    val theme = if (isDarkTheme) "dark" else "light"
    webView.evaluateJavascript("if(typeof setTheme === 'function') { setTheme('$theme'); }", null)
}

@Composable
fun NoInternetDialog(onRetry: () -> Unit, onOpenSettings: () -> Unit) {
    AlertDialog(
        onDismissRequest = { },
        title = { Text(text = stringResource(id = R.string.no_internet_title)) },
        text = { Text(text = stringResource(id = R.string.no_internet_text)) },
        confirmButton = { Button(onClick = onRetry) { Text(text = stringResource(id = R.string.retry)) } },
        dismissButton = { TextButton(onClick = onOpenSettings) { Text(text = stringResource(id = R.string.settings)) } }
    )
}
