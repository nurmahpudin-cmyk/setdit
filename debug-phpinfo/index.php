<?php
// Info tambahan di atas phpinfo() supaya langsung kelihatan
// request ini benar-benar nyampe ke container ini, lewat path apa.
echo "<div style='background:#222;color:#0f0;padding:12px;font-family:monospace;font-size:14px'>";
echo "<b>DEBUG CONTAINER - request diterima</b><br>";
echo "REQUEST_URI: "   . htmlspecialchars($_SERVER['REQUEST_URI']   ?? '-') . "<br>";
echo "HTTP_HOST: "     . htmlspecialchars($_SERVER['HTTP_HOST']     ?? '-') . "<br>";
echo "SCRIPT_NAME: "   . htmlspecialchars($_SERVER['SCRIPT_NAME']   ?? '-') . "<br>";
echo "SERVER_ADDR: "   . htmlspecialchars($_SERVER['SERVER_ADDR']   ?? '-') . "<br>";
echo "REMOTE_ADDR: "   . htmlspecialchars($_SERVER['REMOTE_ADDR']   ?? '-') . " (harusnya IP proxy pusat kalau lewat proxy)<br>";
echo "X-Forwarded-For: " . htmlspecialchars($_SERVER['HTTP_X_FORWARDED_FOR'] ?? '-') . "<br>";
echo "waktu server: "  . date('Y-m-d H:i:s') . "<br>";
echo "</div><hr>";

phpinfo();
