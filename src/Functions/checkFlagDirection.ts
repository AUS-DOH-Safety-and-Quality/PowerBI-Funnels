export default function checkFlagDirection(outlierStatus: "lower" | "upper" | "none",
                                          flagSettings: { process_flag_type: string,
                                                          improvement_direction: string}): "none" | "improvement" | "deterioration" | "neutral_low" | "neutral_high" {
  if (outlierStatus === "none") {
    return outlierStatus;
  }

  const increaseDirectionMap: Record<string, "improvement" | "deterioration" | "neutral_low" | "neutral_high"> = {
    "upper" : "improvement",
    "lower" : "deterioration"
  }
  const decreaseDirectionMap: Record<string, "improvement" | "deterioration" | "neutral_low" | "neutral_high"> = {
    "lower" : "improvement",
    "upper" : "deterioration"
  }
  const neutralDirectionMap: Record<string, "improvement" | "deterioration" | "neutral_low" | "neutral_high"> = {
    "lower" : "neutral_low",
    "upper" : "neutral_high"
  }
  const flagDirectionMap: Record<string, "improvement" | "deterioration" | "neutral_low" | "neutral_high"> = {
    "increase" : increaseDirectionMap[outlierStatus],
    "decrease" : decreaseDirectionMap[outlierStatus],
    "neutral"  : neutralDirectionMap[outlierStatus]
  }

  const mappedFlag = flagDirectionMap[flagSettings.improvement_direction];

  if (flagSettings.process_flag_type !== "both") {
    return mappedFlag === flagSettings.process_flag_type ? mappedFlag : "none";
  } else {
    return mappedFlag;
  }
}
