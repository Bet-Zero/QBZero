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
// Scope: starters, backups with a real claim to a roster spot, and every
// drafted quarterback from the 2025 and 2026 classes. Deep camp arms are left
// off on purpose — adding one is easy, removing it later is not.
//
// See VERIFY below for the entries whose team is stale or unconfirmed.
//
// Run `npm run check-roster` after editing.
export const quarterbacks = [
  { id: 'aaron-rodgers', name: 'Aaron Rodgers', team: 'PIT' },
  { id: 'andy-dalton', name: 'Andy Dalton', team: 'PHI' },
  { id: 'anthony-richardson', name: 'Anthony Richardson', team: 'IND' },
  { id: 'athan-kaliakmanis', name: 'Athan Kaliakmanis', team: 'WAS' },
  { id: 'baker-mayfield', name: 'Baker Mayfield', team: 'TB' },
  { id: 'bo-nix', name: 'Bo Nix', team: 'DEN' },
  { id: 'brock-purdy', name: 'Brock Purdy', team: 'SF' },
  { id: 'bryce-young', name: 'Bryce Young', team: 'CAR' },
  { id: 'c-j-stroud', name: 'C.J. Stroud', team: 'HOU' },
  { id: 'cade-klubnik', name: 'Cade Klubnik', team: 'NYJ' },
  { id: 'caleb-williams', name: 'Caleb Williams', team: 'CHI' },
  { id: 'cameron-ward', name: 'Cam Ward', team: 'TEN' },
  { id: 'carson-wentz', name: 'Carson Wentz', team: 'MIN' },
  { id: 'cole-payton', name: 'Cole Payton', team: 'PHI' },
  { id: 'cooper-rush', name: 'Cooper Rush', team: 'ATL' },
  { id: 'dak-prescott', name: 'Dak Prescott', team: 'DAL' },
  { id: 'daniel-jones', name: 'Daniel Jones', team: 'IND' },
  { id: 'deshaun-watson', name: 'Deshaun Watson', team: 'CLE' },
  { id: 'dillon-gabriel', name: 'Dillon Gabriel', team: 'CLE' },
  { id: 'drake-maye', name: 'Drake Maye', team: 'NE' },
  { id: 'drew-allar', name: 'Drew Allar', team: 'PIT' },
  { id: 'fernando-mendoza', name: 'Fernando Mendoza', team: 'LV' },
  { id: 'geno-smith', name: 'Geno Smith', team: 'NYJ' },
  { id: 'j-j-mccarthy', name: 'J.J. McCarthy', team: 'MIN' },
  { id: 'jacoby-brissett', name: 'Jacoby Brissett', team: 'ARI' },
  { id: 'jake-haener', name: 'Jake Haener', team: 'NYG' },
  { id: 'jalen-hurts', name: 'Jalen Hurts', team: 'PHI' },
  { id: 'jalen-milroe', name: 'Jalen Milroe', team: 'SEA' },
  { id: 'jameis-winston', name: 'Jameis Winston', team: 'NYG' },
  { id: 'jared-goff', name: 'Jared Goff', team: 'DET' },
  { id: 'jaxson-dart', name: 'Jaxson Dart', team: 'NYG' },
  { id: 'jayden-daniels', name: 'Jayden Daniels', team: 'WAS' },
  { id: 'joe-burrow', name: 'Joe Burrow', team: 'CIN' },
  { id: 'joe-flacco', name: 'Joe Flacco', team: 'CIN' },
  { id: 'jordan-love', name: 'Jordan Love', team: 'GB' },
  { id: 'josh-allen', name: 'Josh Allen', team: 'BUF' },
  { id: 'justin-fields', name: 'Justin Fields', team: 'KC' },
  { id: 'justin-herbert', name: 'Justin Herbert', team: 'LAC' },
  { id: 'kirk-cousins', name: 'Kirk Cousins', team: 'LV' },
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
  { id: 'patrick-mahomes', name: 'Patrick Mahomes', team: 'KC' },
  { id: 'quinn-ewers', name: 'Quinn Ewers', team: 'JAX' },
  { id: 'riley-leonard', name: 'Riley Leonard', team: 'IND' },
  { id: 'russell-wilson', name: 'Russell Wilson', team: 'NYG' },
  { id: 'sam-darnold', name: 'Sam Darnold', team: 'SEA' },
  { id: 'sam-howell', name: 'Sam Howell', team: 'PHI' },
  { id: 'shedeur-sanders', name: 'Shedeur Sanders', team: 'CLE' },
  { id: 'spencer-rattler', name: 'Spencer Rattler', team: 'NO' },
  { id: 'tanner-mckee', name: 'Tanner McKee', team: 'PHI' },
  { id: 'taylen-green', name: 'Taylen Green', team: 'CLE' },
  { id: 'taylor-heinicke', name: 'Taylor Heinicke', team: 'LAC' },
  { id: 'trevor-lawrence', name: 'Trevor Lawrence', team: 'JAX' },
  { id: 'trey-lance', name: 'Trey Lance', team: 'LAC' },
  { id: 'tua-tagovailoa', name: 'Tua Tagovailoa', team: 'ATL' },
  { id: 'tyler-shough', name: 'Tyler Shough', team: 'NO' },
  { id: 'tyrod-taylor', name: 'Tyrod Taylor', team: 'GB' },
  { id: 'will-howard', name: 'Will Howard', team: 'PIT' },
  { id: 'zach-wilson', name: 'Zach Wilson', team: 'NO' },
];

// VERIFY — entries whose team is a last-known value rather than a confirmed
// 2026 roster spot. `team` is only a seed, so a wrong one here is cosmetic
// until someone corrects it on the profile, but these are the ones to look at
// first next time:
//
//   russell-wilson    retired during/after 2025; NYG is his last team.
//                     Mark him retired on his profile.
//   taylor-heinicke   cut by the Chargers in camp; LAC is his last team.
//   sam-howell        traded to PHI, but the Eagles' 2026 QB room is reported
//                     as Hurts / McKee / Dalton / Payton. May be gone.
//   jacoby-brissett   ARI is from 2025; 2026 reports are contradictory.
//   tyrod-taylor      GB unconfirmed.
//   jake-haener       signed by NYG 17 Aug 2026, practice squad; one report
//                     has him released since.
//
// Deliberately left off as camp arms rather than roster quarterbacks:
// Sam Hartman (WAS), Malik Cunningham and Josh Johnson (BAL), Tyler Huntley
// (agreed terms with CLE but absent from their depth chart), Jack Strand (ATL),
// Brady Cook (NYJ). Add them if you want them gradable.
