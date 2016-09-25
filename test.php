<?php
$output = $_POST;

//echo json_encode($output);

$jsonString = file_get_contents('data.json');
$data = json_decode($jsonString, true);

$data['age'] = 40;

$newJsonString = json_encode($data);
$file = file_put_contents('data.json', $newJsonString);

if (empty($file)) {
  echo 'failed...';
} else {
  echo 'success...';
}

//echo json_encode($data);