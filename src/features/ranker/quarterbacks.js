// The curated quarterback roster, current for the 2026 season.
//
// This list decides who the app carries. `team` is a seed value: the saved
// player record wins at runtime (see useQBRoster), so correcting a team here
// and re-running populateQBs is what actually moves someone.
//
// Never remove an entry. Grades and any past ranking containing a quarterback
// depend on it existing — mark them retired on their profile instead, which
// keeps them rankable for past seasons while dropping them from the ranker's
// default pool. Ids are Firestore document ids and must never change once a
// quarterback has been graded.
//
// Scope: every quarterback on a 53-man roster or practice squad, including the
// 2025 and 2026 draft classes. Entries are sorted by id.
//
// See VERIFY below for the entries whose team is stale or unconfirmed.
//
// Run `npm run check-roster` after editing.
export const quarterbacks = [
  { id: 'aaron-rodgers', name: 'Aaron Rodgers', team: 'PIT' },
  { id: 'aidan-oconnell', name: "Aidan O'Connell", team: 'LV' },
  { id: 'andy-dalton', name: 'Andy Dalton', team: 'PHI' },
  { id: 'anthony-richardson', name: 'Anthony Richardson', team: 'IND' },
  { id: 'athan-kaliakmanis', name: 'Athan Kaliakmanis', team: 'WAS' },
  { id: 'baker-mayfield', name: 'Baker Mayfield', team: 'TB' },
  { id: 'behren-morton', name: 'Behren Morton', team: 'NE' },
  { id: 'bo-nix', name: 'Bo Nix', team: 'DEN' },
  { id: 'brady-cook', name: 'Brady Cook', team: 'MIA' },
  { id: 'brock-purdy', name: 'Brock Purdy', team: 'SF' },
  { id: 'bryce-young', name: 'Bryce Young', team: 'CAR' },
  { id: 'c-j-stroud', name: 'C.J. Stroud', team: 'HOU' },
  { id: 'cade-klubnik', name: 'Cade Klubnik', team: 'NYJ' },
  { id: 'caleb-williams', name: 'Caleb Williams', team: 'CHI' },
  { id: 'cameron-ward', name: 'Cam Ward', team: 'TEN' },
  { id: 'carson-beck', name: 'Carson Beck', team: 'ARI' },
  { id: 'carson-wentz', name: 'Carson Wentz', team: 'MIN' },
  { id: 'case-keenum', name: 'Case Keenum', team: 'CHI' },
  { id: 'cole-payton', name: 'Cole Payton', team: 'PHI' },
  { id: 'cooper-rush', name: 'Cooper Rush', team: 'ATL' },
  { id: 'dak-prescott', name: 'Dak Prescott', team: 'DAL' },
  { id: 'daniel-jones', name: 'Daniel Jones', team: 'IND' },
  { id: 'davis-mills', name: 'Davis Mills', team: 'HOU' },
  { id: 'deshaun-watson', name: 'Deshaun Watson', team: 'CLE' },
  { id: 'dillon-gabriel', name: 'Dillon Gabriel', team: 'CLE' },
  { id: 'drake-maye', name: 'Drake Maye', team: 'NE' },
  { id: 'drew-allar', name: 'Drew Allar', team: 'PIT' },
  { id: 'drew-lock', name: 'Drew Lock', team: 'SEA' },
  { id: 'fernando-mendoza', name: 'Fernando Mendoza', team: 'LV' },
  { id: 'gardner-minshew-ii', name: 'Gardner Minshew II', team: 'ARI' },
  { id: 'garrett-nussmeier', name: 'Garrett Nussmeier', team: 'KC' },
  { id: 'geno-smith', name: 'Geno Smith', team: 'NYJ' },
  { id: 'haynes-king', name: 'Haynes King', team: 'CAR' },
  { id: 'j-j-mccarthy', name: 'J.J. McCarthy', team: 'MIN' },
  { id: 'jack-strand', name: 'Jack Strand', team: 'ATL' },
  { id: 'jacoby-brissett', name: 'Jacoby Brissett', team: 'ARI' },
  { id: 'jake-haener', name: 'Jake Haener', team: 'NYG' },
  { id: 'jalen-hurts', name: 'Jalen Hurts', team: 'PHI' },
  { id: 'jalen-milroe', name: 'Jalen Milroe', team: 'SEA' },
  { id: 'jalon-daniels', name: 'Jalon Daniels', team: 'TB' },
  { id: 'jameis-winston', name: 'Jameis Winston', team: 'NYG' },
  { id: 'jared-goff', name: 'Jared Goff', team: 'DET' },
  { id: 'jarrett-stidham', name: 'Jarrett Stidham', team: 'DEN' },
  { id: 'jaxson-dart', name: 'Jaxson Dart', team: 'NYG' },
  { id: 'jayden-daniels', name: 'Jayden Daniels', team: 'WAS' },
  { id: 'joe-burrow', name: 'Joe Burrow', team: 'CIN' },
  { id: 'joe-fagnano', name: 'Joe Fagnano', team: 'BAL' },
  { id: 'joe-flacco', name: 'Joe Flacco', team: 'CIN' },
  { id: 'jordan-love', name: 'Jordan Love', team: 'GB' },
  { id: 'josh-allen', name: 'Josh Allen', team: 'BUF' },
  { id: 'joshua-dobbs', name: 'Joshua Dobbs', team: 'DET' },
  { id: 'justin-fields', name: 'Justin Fields', team: 'KC' },
  { id: 'justin-herbert', name: 'Justin Herbert', team: 'LAC' },
  { id: 'kenny-pickett', name: 'Kenny Pickett', team: 'CAR' },
  { id: 'kirk-cousins', name: 'Kirk Cousins', team: 'LV' },
  { id: 'kurtis-rourke', name: 'Kurtis Rourke', team: 'SF' },
  { id: 'kyle-allen', name: 'Kyle Allen', team: 'BUF' },
  { id: 'kyle-mccord', name: 'Kyle McCord', team: 'MIA' },
  { id: 'kyler-murray', name: 'Kyler Murray', team: 'MIN' },
  { id: 'lamar-jackson', name: 'Lamar Jackson', team: 'BAL' },
  { id: 'mac-jones', name: 'Mac Jones', team: 'SF' },
  { id: 'malik-willis', name: 'Malik Willis', team: 'MIA' },
  { id: 'marcus-mariota', name: 'Marcus Mariota', team: 'WAS' },
  { id: 'mason-rudolph', name: 'Mason Rudolph', team: 'PIT' },
  { id: 'matthew-stafford', name: 'Matthew Stafford', team: 'LAR' },
  { id: 'max-brosmer', name: 'Max Brosmer', team: 'MIN' },
  { id: 'michael-penix-jr', name: 'Michael Penix Jr', team: 'ATL' },
  { id: 'mitchell-trubisky', name: 'Mitchell Trubisky', team: 'TEN' },
  { id: 'patrick-mahomes', name: 'Patrick Mahomes', team: 'KC' },
  { id: 'quinn-ewers', name: 'Quinn Ewers', team: 'JAX' },
  { id: 'riley-leonard', name: 'Riley Leonard', team: 'IND' },
  { id: 'russell-wilson', name: 'Russell Wilson', team: 'NYG' },
  { id: 'sam-darnold', name: 'Sam Darnold', team: 'SEA' },
  { id: 'sam-ehlinger', name: 'Sam Ehlinger', team: 'DEN' },
  { id: 'sam-howell', name: 'Sam Howell', team: 'DAL' },
  { id: 'shedeur-sanders', name: 'Shedeur Sanders', team: 'CLE' },
  { id: 'spencer-rattler', name: 'Spencer Rattler', team: 'NO' },
  { id: 'stetson-bennett-iv', name: 'Stetson Bennett IV', team: 'LAR' },
  { id: 'tanner-mckee', name: 'Tanner McKee', team: 'PHI' },
  { id: 'taylen-green', name: 'Taylen Green', team: 'CLE' },
  { id: 'taylor-heinicke', name: 'Taylor Heinicke', team: 'LAC' },
  { id: 'tommy-devito', name: 'Tommy DeVito', team: 'NE' },
  { id: 'trevor-lawrence', name: 'Trevor Lawrence', team: 'JAX' },
  { id: 'trey-lance', name: 'Trey Lance', team: 'LAC' },
  { id: 'tua-tagovailoa', name: 'Tua Tagovailoa', team: 'ATL' },
  { id: 'ty-simpson', name: 'Ty Simpson', team: 'LAR' },
  { id: 'tyler-huntley', name: 'Tyler Huntley', team: 'BAL' },
  { id: 'tyler-shough', name: 'Tyler Shough', team: 'NO' },
  { id: 'tyrod-taylor', name: 'Tyrod Taylor', team: 'GB' },
  { id: 'tyson-bagent', name: 'Tyson Bagent', team: 'CHI' },
  { id: 'will-howard', name: 'Will Howard', team: 'PIT' },
  { id: 'zach-wilson', name: 'Zach Wilson', team: 'NO' },
];

// VERIFY — entries whose team is a last-known value rather than a confirmed
// 2026 roster spot. `team` is only a seed, so a wrong one here is cosmetic
// until someone corrects it on the profile, but these are the ones to look at
// first next season:
//
//   russell-wilson    retired during/after 2025; NYG is his last team.
//                     Mark him retired on his profile.
//   taylor-heinicke   cut by the Chargers in camp; LAC is his last team.
//   jacoby-brissett   ARI is from 2025; 2026 reports are contradictory.
//   tyrod-taylor      GB unconfirmed.
//   jake-haener       signed by NYG 17 Aug 2026 to the practice squad; one
//                     report has him released since.
