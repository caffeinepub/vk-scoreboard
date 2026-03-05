// Local cricket enums — these were previously exported from backend.d but are
// now only needed in frontend local scoring logic.

export enum DismissalType {
  bowled = "bowled",
  caught = "caught",
  runout = "runout",
  stumping = "stumping",
  lbw = "lbw",
  hitwicket = "hitwicket",
}

export enum ExtrasType {
  none = "none",
  wide = "wide",
  noball = "noball",
  bye = "bye",
  legbye = "legbye",
}
