"""
Curated real-world recommendation dataset for MoodMeld.
Movies: Bollywood + Hollywood | Music: Bollywood + Hollywood + Indie
Each entry: (title, artist_or_genre, year, rating, origin)
"""
import random

# ── MUSIC DATABASE ──
# Format: (title, artist, origin)  origin: B=Bollywood, H=Hollywood, I=Indie

MUSIC = {
    "happy": [
        ("Gallan Goodiyaan", "Shankar-Ehsaan-Loy", "B"),
        ("Badtameez Dil", "Benny Dayal", "B"),
        ("London Thumakda", "Labh Janjua & Sonu Kakkar", "B"),
        ("Balam Pichkari", "Vishal Dadlani & Shalmali", "B"),
        ("Dil Dhadakne Do Title Track", "Priyanka Chopra & Farhan Akhtar", "B"),
        ("Nachde Ne Saare", "Jasleen Royal", "B"),
        ("Ilahi", "Arijit Singh", "B"),
        ("Kho Gaye Hum Kahan", "Prateek Kuhad & Jasleen Royal", "B"),
        ("Happy", "Pharrell Williams", "H"),
        ("Walking on Sunshine", "Katrina & The Waves", "H"),
        ("Don't Stop Me Now", "Queen", "H"),
        ("Here Comes the Sun", "The Beatles", "H"),
        ("Uptown Funk", "Bruno Mars ft. Mark Ronson", "H"),
        ("Shake It Off", "Taylor Swift", "H"),
        ("Good as Hell", "Lizzo", "H"),
        ("On Top of the World", "Imagine Dragons", "H"),
        ("Riptide", "Vance Joy", "I"),
        ("Ho Hey", "The Lumineers", "I"),
        ("Home", "Edward Sharpe & The Magnetic Zeros", "I"),
        ("Dog Days Are Over", "Florence + The Machine", "I"),
    ],
    "calm": [
        ("Tum Hi Ho", "Arijit Singh", "B"),
        ("Agar Tum Saath Ho", "Arijit Singh & Alka Yagnik", "B"),
        ("Kabira", "Tochi Raina & Rekha Bhardwaj", "B"),
        ("Kun Faya Kun", "A.R. Rahman & Javed Ali", "B"),
        ("Raabta", "Arijit Singh", "B"),
        ("Tere Bina", "A.R. Rahman", "B"),
        ("Jashn-e-Bahaara", "Javed Ali", "B"),
        ("Weightless", "Marconi Union", "H"),
        ("Clair de Lune", "Debussy", "H"),
        ("River Flows in You", "Yiruma", "H"),
        ("Gymnopédie No.1", "Erik Satie", "H"),
        ("Experience", "Ludovico Einaudi", "H"),
        ("Skinny Love", "Bon Iver", "I"),
        ("Holocene", "Bon Iver", "I"),
        ("re: Stacks", "Bon Iver", "I"),
        ("To Build a Home", "The Cinematic Orchestra", "I"),
        ("cold/mess", "Prateek Kuhad", "I"),
        ("Kasoor", "Prateek Kuhad", "I"),
        ("Saturn", "Sleeping At Last", "I"),
    ],
    "sad": [
        ("Channa Mereya", "Arijit Singh", "B"),
        ("Tujhe Kitna Chahein Aur Hum", "Jubin Nautiyal", "B"),
        ("Tera Ban Jaunga", "Akhil Sachdeva & Tulsi Kumar", "B"),
        ("Phir Le Aya Dil", "Arijit Singh", "B"),
        ("Tujhi Mein Rab Dikhta Hai", "Roop Kumar Rathod", "B"),
        ("Ae Dil Hai Mushkil", "Arijit Singh", "B"),
        ("Luka Chuppi", "Lata Mangeshkar & A.R. Rahman", "B"),
        ("Fix You", "Coldplay", "H"),
        ("The Night We Met", "Lord Huron", "H"),
        ("Everybody Hurts", "R.E.M.", "H"),
        ("Let Her Go", "Passenger", "H"),
        ("Someone Like You", "Adele", "H"),
        ("Hallelujah", "Jeff Buckley", "H"),
        ("Skinny Love", "Birdy", "I"),
        ("Youth", "Daughter", "I"),
        ("Motion Sickness", "Phoebe Bridgers", "I"),
        ("For Emma", "Bon Iver", "I"),
        ("Liability", "Lorde", "I"),
    ],
    "anxious": [
        ("Kun Faya Kun", "A.R. Rahman", "B"),
        ("Khaabon Ke Parinday", "Mohit Chauhan & Alyssa Mendonsa", "B"),
        ("Tum Se Hi", "Mohit Chauhan", "B"),
        ("Mann Mera", "Gajendra Verma", "B"),
        ("Breathe Me", "Sia", "H"),
        ("Unsteady", "X Ambassadors", "H"),
        ("Lean on Me", "Bill Withers", "H"),
        ("Three Little Birds", "Bob Marley", "H"),
        ("Here Comes the Sun", "The Beatles", "H"),
        ("Better Days", "OneRepublic", "H"),
        ("Everything's Not Lost", "Coldplay", "H"),
        ("Float On", "Modest Mouse", "I"),
        ("First Day of My Life", "Bright Eyes", "I"),
        ("cold/mess", "Prateek Kuhad", "I"),
        ("Bloom", "The Paper Kites", "I"),
        ("Saturn", "Sleeping At Last", "I"),
    ],
    "stressed": [
        ("Ik Vaari Aa", "Arijit Singh", "B"),
        ("Safar", "Arijit Singh", "B"),
        ("Phir Se Ud Chala", "Mohit Chauhan", "B"),
        ("Dil Se Re", "A.R. Rahman", "B"),
        ("Let It Be", "The Beatles", "H"),
        ("Imagine", "John Lennon", "H"),
        ("Don't Worry Be Happy", "Bobby McFerrin", "H"),
        ("Moonlight Sonata", "Beethoven", "H"),
        ("Nocturne Op.9 No.2", "Chopin", "H"),
        ("What a Wonderful World", "Louis Armstrong", "H"),
        ("Banana Pancakes", "Jack Johnson", "H"),
        ("Better Together", "Jack Johnson", "H"),
        ("Stubborn Love", "The Lumineers", "I"),
        ("I Will Follow You into the Dark", "Death Cab for Cutie", "I"),
        ("Such Great Heights", "The Postal Service", "I"),
        ("New Slang", "The Shins", "I"),
    ],
    "burned_out": [
        ("Iktara", "Amit Trivedi & Kavita Seth", "B"),
        ("Manja", "Amit Trivedi", "B"),
        ("Tu Hai", "A.R. Rahman", "B"),
        ("Nadaan Parindey", "A.R. Rahman & Mohit Chauhan", "B"),
        ("Comfortably Numb", "Pink Floyd", "H"),
        ("Sound of Silence", "Simon & Garfunkel", "H"),
        ("Mad World", "Gary Jules", "H"),
        ("Wish You Were Here", "Pink Floyd", "H"),
        ("Somewhere Over the Rainbow", "Israel Kamakawiwo'ole", "H"),
        ("Space Song", "Beach House", "I"),
        ("Myth", "Beach House", "I"),
        ("Intro", "The xx", "I"),
        ("Agnes", "Glass Animals", "I"),
        ("Apocalypse", "Cigarettes After Sex", "I"),
        ("Affection", "Cigarettes After Sex", "I"),
    ],
    "fatigued": [
        ("Ilahi", "Arijit Singh", "B"),
        ("Matargashti", "Mohit Chauhan", "B"),
        ("Dil Dhadakne Do", "Shankar-Ehsaan-Loy", "B"),
        ("Kar Har Maidaan Fateh", "Sukhwinder Singh", "B"),
        ("Zinda", "Siddharth Mahadevan", "B"),
        ("Morning Has Broken", "Cat Stevens", "H"),
        ("Here Comes the Sun", "The Beatles", "H"),
        ("Lovely Day", "Bill Withers", "H"),
        ("Send Me on My Way", "Rusted Root", "H"),
        ("Island in the Sun", "Weezer", "H"),
        ("1901", "Phoenix", "I"),
        ("Electric Feel", "MGMT", "I"),
        ("Sunflower", "Rex Orange County", "I"),
        ("Best Part", "Daniel Caesar ft. H.E.R.", "I"),
        ("Peach Pit", "Peach Pit", "I"),
    ],
    "motivated": [
        ("Kar Har Maidaan Fateh", "Sukhwinder Singh & Shreya Ghoshal", "B"),
        ("Chak De India", "Sukhwinder Singh", "B"),
        ("Ziddi Dil", "Vishal Dadlani", "B"),
        ("Sultan Title Track", "Salman Khan & Vishal Dadlani", "B"),
        ("Brothers Anthem", "Vishal Dadlani", "B"),
        ("Dangal Title Track", "Daler Mehndi", "B"),
        ("Get Lucky", "Teri Meri Kahaani - Arijit Singh", "B"),
        ("Eye of the Tiger", "Survivor", "H"),
        ("Lose Yourself", "Eminem", "H"),
        ("Stronger", "Kanye West", "H"),
        ("Remember the Name", "Fort Minor", "H"),
        ("We Will Rock You", "Queen", "H"),
        ("Hall of Fame", "The Script ft. will.i.am", "H"),
        ("Thunder", "Imagine Dragons", "H"),
        ("Believer", "Imagine Dragons", "H"),
        ("Warriors", "Imagine Dragons", "H"),
        ("Run Boy Run", "Woodkid", "I"),
        ("Feel It Still", "Portugal. The Man", "I"),
        ("Take Me Out", "Franz Ferdinand", "I"),
    ],
}

# ── MOVIE DATABASE ──
# Format: (title, genre, year, rating, origin)

MOVIES = {
    "happy": [
        ("3 Idiots", "Comedy, Drama", 2009, 8.4, "B"),
        ("Zindagi Na Milegi Dobara", "Adventure, Comedy, Drama", 2011, 8.2, "B"),
        ("Yeh Jawaani Hai Deewani", "Comedy, Drama, Romance", 2013, 7.2, "B"),
        ("Dil Chahta Hai", "Comedy, Drama, Romance", 2001, 8.1, "B"),
        ("Queen", "Adventure, Comedy, Drama", 2014, 8.2, "B"),
        ("PK", "Comedy, Drama, SciFi", 2014, 8.1, "B"),
        ("Munna Bhai M.B.B.S", "Comedy, Drama", 2003, 8.1, "B"),
        ("Chhichhore", "Comedy, Drama", 2019, 8.2, "B"),
        ("Barfi!", "Comedy, Drama, Romance", 2012, 8.1, "B"),
        ("The Grand Budapest Hotel", "Adventure, Comedy", 2014, 8.1, "H"),
        ("Forrest Gump", "Comedy, Drama, Romance", 1994, 8.8, "H"),
        ("The Intouchables", "Biography, Comedy, Drama", 2011, 8.5, "H"),
        ("Paddington 2", "Adventure, Comedy, Family", 2017, 7.8, "H"),
        ("Soul", "Animation, Comedy, Fantasy", 2020, 8.1, "H"),
        ("The Secret Life of Walter Mitty", "Adventure, Comedy, Drama", 2013, 7.3, "H"),
        ("Ferris Bueller's Day Off", "Comedy", 1986, 7.8, "H"),
        ("The Breakfast Club", "Comedy, Drama", 1985, 7.8, "H"),
        ("Little Miss Sunshine", "Comedy, Drama", 2006, 7.8, "H"),
    ],
    "calm": [
        ("Piku", "Comedy, Drama", 2015, 7.6, "B"),
        ("The Lunchbox", "Drama, Romance", 2013, 7.8, "B"),
        ("Lootera", "Crime, Drama, Romance", 2013, 7.5, "B"),
        ("October", "Drama, Romance", 2018, 7.2, "B"),
        ("Swades", "Drama", 2004, 8.2, "B"),
        ("My Neighbor Totoro", "Animation, Fantasy", 1988, 8.2, "H"),
        ("Spirited Away", "Animation, Adventure", 2001, 8.6, "H"),
        ("Life of Pi", "Adventure, Drama, Fantasy", 2012, 7.9, "H"),
        ("A Beautiful Day in the Neighborhood", "Biography, Drama", 2019, 7.3, "H"),
        ("Moonrise Kingdom", "Adventure, Comedy, Drama", 2012, 7.8, "H"),
        ("The Secret Garden", "Drama, Family, Fantasy", 2020, 6.0, "H"),
        ("Big Fish", "Adventure, Drama, Fantasy", 2003, 8.0, "H"),
        ("Chef", "Comedy, Drama", 2014, 7.3, "H"),
    ],
    "sad": [
        ("Taare Zameen Par", "Drama, Family", 2007, 8.4, "B"),
        ("Masaan", "Drama, Romance", 2015, 8.1, "B"),
        ("Rang De Basanti", "Comedy, Crime, Drama", 2006, 8.2, "B"),
        ("Dil Bechara", "Comedy, Drama, Romance", 2020, 7.0, "B"),
        ("Rockstar", "Drama, Musical, Romance", 2011, 7.7, "B"),
        ("Tamasha", "Comedy, Drama, Romance", 2015, 7.5, "B"),
        ("Dear Zindagi", "Drama", 2016, 7.4, "B"),
        ("The Pursuit of Happyness", "Biography, Drama", 2006, 8.0, "H"),
        ("Good Will Hunting", "Drama, Romance", 2011, 8.3, "H"),
        ("Inside Out", "Animation, Comedy, Drama", 2015, 8.1, "H"),
        ("Up", "Animation, Adventure, Comedy", 2009, 8.3, "H"),
        ("The Shawshank Redemption", "Drama", 1994, 9.3, "H"),
        ("Coco", "Animation, Adventure, Comedy", 2017, 8.4, "H"),
        ("A Star Is Born", "Drama, Music, Romance", 2018, 7.6, "H"),
    ],
    "anxious": [
        ("Dear Zindagi", "Drama", 2016, 7.4, "B"),
        ("English Vinglish", "Comedy, Drama, Family", 2012, 7.8, "B"),
        ("Queen", "Adventure, Comedy, Drama", 2014, 8.2, "B"),
        ("Anand", "Drama", 1971, 8.3, "B"),
        ("Hera Pheri", "Action, Comedy, Crime", 2000, 8.2, "B"),
        ("Finding Nemo", "Animation, Adventure, Comedy", 2003, 8.2, "H"),
        ("The Princess Bride", "Adventure, Family, Fantasy", 1987, 8.0, "H"),
        ("Legally Blonde", "Comedy, Romance", 2001, 6.4, "H"),
        ("Monsters, Inc.", "Animation, Comedy, Family", 2001, 8.1, "H"),
        ("Amélie", "Comedy, Romance", 2001, 8.3, "H"),
        ("Luca", "Animation, Adventure, Comedy", 2021, 7.4, "H"),
        ("Ratatouille", "Animation, Comedy, Family", 2007, 8.1, "H"),
    ],
    "stressed": [
        ("Dil Chahta Hai", "Comedy, Drama, Romance", 2001, 8.1, "B"),
        ("Zindagi Na Milegi Dobara", "Adventure, Comedy, Drama", 2011, 8.2, "B"),
        ("Hera Pheri", "Action, Comedy, Crime", 2000, 8.2, "B"),
        ("Andhadhun", "Crime, Thriller", 2018, 8.3, "B"),
        ("Stree", "Comedy, Horror", 2018, 7.5, "B"),
        ("The Intern", "Comedy, Drama", 2015, 7.1, "H"),
        ("School of Rock", "Comedy, Music", 2003, 7.1, "H"),
        ("The Grand Budapest Hotel", "Adventure, Comedy", 2014, 8.1, "H"),
        ("Groundhog Day", "Comedy, Drama, Fantasy", 1993, 8.0, "H"),
        ("About Time", "Comedy, Drama, Fantasy", 2013, 7.8, "H"),
        ("Midnight in Paris", "Comedy, Fantasy, Romance", 2011, 7.7, "H"),
        ("Sing Street", "Comedy, Drama, Music", 2016, 7.9, "H"),
    ],
    "burned_out": [
        ("Tamasha", "Comedy, Drama, Romance", 2015, 7.5, "B"),
        ("Swades", "Drama", 2004, 8.2, "B"),
        ("Highway", "Adventure, Drama, Romance", 2014, 7.3, "B"),
        ("Kapoor & Sons", "Comedy, Drama, Romance", 2016, 7.7, "B"),
        ("Piku", "Comedy, Drama", 2015, 7.6, "B"),
        ("Into the Wild", "Adventure, Biography, Drama", 2007, 8.1, "H"),
        ("Wild", "Adventure, Biography, Drama", 2014, 7.1, "H"),
        ("Eat Pray Love", "Biography, Drama, Romance", 2010, 5.8, "H"),
        ("Kiki's Delivery Service", "Animation, Drama, Family", 1989, 7.8, "H"),
        ("The Holiday", "Comedy, Romance", 2006, 6.9, "H"),
        ("Lost in Translation", "Comedy, Drama", 2003, 7.7, "H"),
        ("Nomadland", "Drama", 2020, 7.3, "H"),
    ],
    "fatigued": [
        ("3 Idiots", "Comedy, Drama", 2009, 8.4, "B"),
        ("Chhichhore", "Comedy, Drama", 2019, 8.2, "B"),
        ("Wake Up Sid", "Comedy, Drama, Romance", 2009, 7.5, "B"),
        ("Jaane Tu Ya Jaane Na", "Comedy, Drama, Romance", 2008, 7.5, "B"),
        ("Jab We Met", "Comedy, Drama, Romance", 2007, 7.9, "B"),
        ("Howl's Moving Castle", "Animation, Adventure, Family", 2004, 8.2, "H"),
        ("The Truman Show", "Comedy, Drama, SciFi", 1998, 8.2, "H"),
        ("Amélie", "Comedy, Romance", 2001, 8.3, "H"),
        ("Paddington", "Adventure, Comedy, Family", 2014, 7.5, "H"),
        ("WALL-E", "Animation, Adventure, Family", 2008, 8.4, "H"),
        ("Begin Again", "Drama, Music", 2013, 7.4, "H"),
        ("Julie & Julia", "Biography, Drama, Romance", 2009, 7.0, "H"),
    ],
    "motivated": [
        ("Dangal", "Action, Biography, Drama", 2016, 8.4, "B"),
        ("Bhaag Milkha Bhaag", "Biography, Drama, Sport", 2013, 8.2, "B"),
        ("Chak De! India", "Drama, Sport", 2007, 8.2, "B"),
        ("Lagaan", "Adventure, Drama, Musical", 2001, 8.1, "B"),
        ("Rang De Basanti", "Comedy, Crime, Drama", 2006, 8.2, "B"),
        ("Super 30", "Biography, Drama", 2019, 7.8, "B"),
        ("M.S. Dhoni: The Untold Story", "Biography, Drama, Sport", 2016, 7.8, "B"),
        ("Pad Man", "Biography, Comedy, Drama", 2018, 7.3, "B"),
        ("Rocky", "Drama, Sport", 1976, 8.1, "H"),
        ("Whiplash", "Drama, Music", 2014, 8.5, "H"),
        ("The Social Network", "Biography, Drama", 2010, 7.8, "H"),
        ("Hidden Figures", "Biography, Drama, History", 2016, 7.8, "H"),
        ("The Wolf of Wall Street", "Biography, Comedy, Crime", 2013, 8.2, "H"),
        ("Gladiator", "Action, Adventure, Drama", 2000, 8.5, "H"),
        ("The Dark Knight", "Action, Crime, Drama", 2008, 9.0, "H"),
        ("Inception", "Action, Adventure, SciFi", 2010, 8.8, "H"),
    ],
}

# ── WELLNESS TIPS ──

WELLNESS = {
    "happy": [
        ("Gratitude Journal", "Write 3 things you're grateful for today"),
        ("Share Your Joy", "Call or text someone you care about"),
        ("Creative Expression", "Draw, write, or play music for 15 minutes"),
        ("Celebrate Wins", "Acknowledge something you accomplished recently"),
    ],
    "calm": [
        ("Mindful Walk", "20 minutes outdoors with no phone"),
        ("Body Scan Meditation", "15 min guided body awareness"),
        ("Tea Ritual", "Make tea mindfully, savoring each step"),
        ("Nature Journaling", "Sit outside and sketch or write about what you see"),
    ],
    "sad": [
        ("Self-Compassion Practice", "Place hand on heart, breathe, be kind to yourself"),
        ("Gentle Movement", "A slow walk or gentle yoga stretching"),
        ("Comfort Playlist", "Listen to music that lets you feel your feelings"),
        ("Reach Out", "Text a friend — even 'hey' counts"),
    ],
    "anxious": [
        ("4-7-8 Breathing", "Inhale 4s, hold 7s, exhale 8s — repeat 4 times"),
        ("5-4-3-2-1 Grounding", "Name 5 things you see, 4 you hear, 3 you touch..."),
        ("Cold Water Reset", "Splash cold water on your face to activate vagus nerve"),
        ("Worry Window", "Set 10 min to worry, then consciously move on"),
    ],
    "stressed": [
        ("Progressive Muscle Relaxation", "Tense and release each muscle group"),
        ("Brain Dump", "Write everything on your mind on paper"),
        ("Box Breathing", "4s inhale, 4s hold, 4s exhale, 4s hold"),
        ("Boundary Setting", "Say no to one non-essential task today"),
    ],
    "burned_out": [
        ("Digital Detox", "1 hour away from all screens"),
        ("Permission to Rest", "Take the evening completely off, guilt-free"),
        ("Micro-Recovery", "Do absolutely nothing for 10 minutes"),
        ("Joy Inventory", "List 5 small things that bring you simple pleasure"),
    ],
    "fatigued": [
        ("Power Nap", "20 minutes max — set an alarm"),
        ("Hydrate & Move", "Glass of water + 5 min stretch"),
        ("Sunlight Exposure", "Step outside for 10 minutes of daylight"),
        ("Energy Snack", "Eat something with protein and complex carbs"),
    ],
    "motivated": [
        ("Deep Work Sprint", "90 min focused work on your top priority"),
        ("Set a Bold Goal", "Write down one ambitious target for this week"),
        ("Accountability Share", "Tell someone about your goal"),
        ("Skill Building", "Spend 30 min learning something new"),
    ],
}


def pick_music(mood: str, count: int = 6) -> list:
    """Pick a diverse random selection of music for the given mood."""
    pool = MUSIC.get(mood, MUSIC["calm"])
    # Ensure mix of origins
    by_origin = {"B": [], "H": [], "I": []}
    for song in pool:
        by_origin[song[2]].append(song)
    
    picks = []
    # Try to get at least 2 from each available origin
    for origin in ["B", "H", "I"]:
        avail = by_origin[origin]
        if avail:
            picks.extend(random.sample(avail, min(2, len(avail))))
    
    # Fill remaining from full pool
    remaining = [s for s in pool if s not in picks]
    needed = count - len(picks)
    if needed > 0 and remaining:
        picks.extend(random.sample(remaining, min(needed, len(remaining))))
    
    random.shuffle(picks)
    return [
        {
            "type": "music",
            "title": t[0],
            "subtitle": t[1],
            "source": {"B": "Bollywood", "H": "Hollywood", "I": "Indie"}[t[2]],
            "origin": t[2],
            "url": None,
            "image": None,
        }
        for t in picks[:count]
    ]


def pick_movies(mood: str, count: int = 5) -> list:
    """Pick a diverse random selection of movies for the given mood."""
    pool = MOVIES.get(mood, MOVIES["calm"])
    by_origin = {"B": [], "H": []}
    for m in pool:
        by_origin[m[4]].append(m)
    
    picks = []
    for origin in ["B", "H"]:
        avail = by_origin[origin]
        if avail:
            picks.extend(random.sample(avail, min(2, len(avail))))
    
    remaining = [m for m in pool if m not in picks]
    needed = count - len(picks)
    if needed > 0 and remaining:
        picks.extend(random.sample(remaining, min(needed, len(remaining))))
    
    random.shuffle(picks)
    return [
        {
            "type": "movie",
            "title": m[0],
            "subtitle": m[1],
            "source": {"B": "Bollywood", "H": "Hollywood"}[m[4]],
            "url": None,
            "image": None,
            "rating": m[3],
            "year": m[2],
        }
        for m in picks[:count]
    ]


def pick_wellness(mood: str, count: int = 3) -> list:
    """Pick wellness recommendations for the mood."""
    pool = WELLNESS.get(mood, WELLNESS["calm"])
    picks = random.sample(pool, min(count, len(pool)))
    return [
        {
            "type": "wellness",
            "title": w[0],
            "subtitle": w[1],
            "source": "MoodMeld",
            "url": None,
            "image": None,
        }
        for w in picks
    ]
