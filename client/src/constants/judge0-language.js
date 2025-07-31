const languageCodes = {
  "py": "python",
  "js": "javascript",
  "ts": "typescript",
  "cpp": "cpp",
  "c": "c",
  "java": "java",
  "rb": "ruby",
  "go": "go",
  "php": "php",
  "rs": "rust",
  "kt": "kotlin",
  "swift": "swift",
  "cs": "csharp",
  "sh": "bash"
}


const judge0LanguageMap = {
  assembly: 45,
  bash: 46,
  basic: 47,
  c: 50,
  cpp: 54,
  csharp: 51,
  clojure: 18,
  commonlisp: 55,
  crystal: 19,
  d: 56,
  elixir: 57,
  erlang: 58,
  fortran: 59,
  go: 60,
  haskell: 61,
  java: 62,
  javascript: 63,
  lua: 64,
  ocaml: 65,
  octave: 66,
  pascal: 67,
  php: 68,
  prolog: 69,
  python2: 70,
  python: 71,        // Latest Python 3.x
  ruby: 72,
  rust: 73,
  typescript: 74,
  text: 43,
};

const getExtension = (filename) => filename.split('.').pop();

const getLanguageIdFromFilename = (filename) => {
  const ext = getExtension(filename);
  const lang = languageCodes[ext];
  return lang ? judge0LanguageMap[lang] : null;
};

export { getLanguageIdFromFilename };