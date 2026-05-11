<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Database path
$dbPath = __DIR__ . '/../database/planets.db';

// Create database folder if it doesn't exist
if (!is_dir(dirname($dbPath))) {
    mkdir(dirname($dbPath), 0777, true);
}

try {
    $db = new PDO('sqlite:' . $dbPath);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Create table
    $db->exec("CREATE TABLE IF NOT EXISTS planets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        key_name TEXT NOT NULL,
        emoji TEXT,
        description TEXT,
        type TEXT,
        diameter TEXT,
        moons TEXT,
        orbit TEXT,
        temperature TEXT
    )");

    // Seed if empty
    $count = $db->query("SELECT COUNT(*) FROM planets")->fetchColumn();
    if ($count == 0) {
        $planets = [
            ['Sun',     'sun',     '☀️', 'The star at the centre of our Solar System, a nearly perfect sphere of hot plasma.', 'Star',       '1,390,000 km', '0',   'N/A',           '5,500°C'],
            ['Mercury', 'mercury', '☿',  'Smallest planet, closest to the Sun. Has almost no atmosphere.',                     'Terrestrial','4,879 km',     '0',   '88 Earth days', '167°C avg'],
            ['Venus',   'venus',   '♀',  'Hottest planet due to its thick CO₂ greenhouse atmosphere.',                         'Terrestrial','12,104 km',    '0',   '225 days',      '465°C'],
            ['Earth',   'earth',   '🌍', 'Our home planet — the only known planet to support life.',                            'Terrestrial','12,742 km',    '1',   '365.25 days',   '15°C avg'],
            ['Mars',    'mars',    '♂',  'The Red Planet. Has the tallest volcano in the solar system — Olympus Mons.',         'Terrestrial','6,779 km',     '2',   '687 Earth days','-60°C avg'],
            ['Jupiter', 'jupiter', '♃',  'Largest planet in the solar system with a Great Red Spot storm.',                    'Gas Giant',  '139,820 km',   '95',  '12 Earth years','-110°C'],
            ['Saturn',  'saturn',  '♄',  'Famous for its stunning ring system made of ice and rock.',                          'Gas Giant',  '116,460 km',   '146', '29 Earth years','-140°C'],
            ['Uranus',  'uranus',  '⛢',  'An ice giant that rotates on its side. Has faint rings.',                            'Ice Giant',  '50,724 km',    '27',  '84 Earth years','-195°C'],
            ['Neptune', 'neptune', '♆',  'The farthest planet. Has the strongest winds — up to 2,100 km/h.',                   'Ice Giant',  '49,244 km',    '16',  '165 Earth years','-200°C'],
        ];

        $stmt = $db->prepare("INSERT INTO planets (name, key_name, emoji, description, type, diameter, moons, orbit, temperature) VALUES (?,?,?,?,?,?,?,?,?)");
        foreach ($planets as $p) {
            $stmt->execute($p);
        }
    }

    // Handle request - get specific planet or all
    $keyName = isset($_GET['planet']) ? $_GET['planet'] : null;

    if ($keyName) {
        $stmt = $db->prepare("SELECT * FROM planets WHERE key_name = ?");
        $stmt->execute([$keyName]);
        $planet = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($planet) {
            echo json_encode(['success' => true, 'planet' => $planet]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Planet not found']);
        }
    } else {
        $result = $db->query("SELECT * FROM planets ORDER BY id")->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['success' => true, 'planets' => $result]);
    }

} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>
