<?php
$filepath = "live-reload.json";
if (isset($_POST["reload"])) {
    if (!file_exists($filepath)) {
        $file = fopen($filepath, "a") or die("Unable to open file!");
        $txt = json_encode(["reload" => "false"]);
        fwrite($file, $txt);
        fclose($file);
        die;
        http_response_code(200);
    }
    $file = fopen($filepath, "w") or die("Unable to open file!");
    $txt = json_encode(["reload" => $_POST["reload"]]);
    fwrite($file, $txt);
    fclose($file);
    http_response_code(200);
} else {
    header("Content-Type: application/json");
    if (!file_exists($filepath)) {
        $file = fopen($filepath, "a") or die("Unable to open file!");
        $txt = json_encode(["reload" => "false"]);
        fwrite($file, $txt);
        fclose($file);
    }
    
    // Read the file contents into a string
    $file_contents = file_get_contents($filepath);
    
    http_response_code(200);
    die($file_contents);
}
http_response_code(403);
