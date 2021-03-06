import settingsObject from "../Classes/settingsObject"

type groupKeysT = {
  group: string;
  colour: string;
  width: number;
}

function getGroupKeys(inputSettings: settingsObject): groupKeysT[] {
  let l99_width: number = inputSettings.lines.width_99.value;
  let l95_width: number = inputSettings.lines.width_95.value;
  let target_width: number = inputSettings.lines.width_target.value;
  let alt_target_width: number = inputSettings.lines.width_alt_target.value;
  let l99_colour: string = inputSettings.lines.colour_99.value;
  let l95_colour: string = inputSettings.lines.colour_95.value;
  let target_colour: string = inputSettings.lines.colour_target.value;
  let alt_target_colour: string = inputSettings.lines.colour_alt_target.value;

  let GroupKeys: groupKeysT[] = new Array<groupKeysT>();
  GroupKeys.push({
    group: "ll99",
    colour: l99_colour,
    width: l99_width
  })
  GroupKeys.push({
    group: "ll95",
    colour: l95_colour,
    width: l95_width
  })
  GroupKeys.push({
    group: "ul95",
    colour: l95_colour,
    width: l95_width
  })
  GroupKeys.push({
    group: "ul99",
    colour: l99_colour,
    width: l99_width
  })
  GroupKeys.push({
    group: "target",
    colour: target_colour,
    width: target_width
  })
  GroupKeys.push({
    group: "alt_target",
    colour: alt_target_colour,
    width: alt_target_width
  })

  return GroupKeys;
}

export default getGroupKeys;
export { groupKeysT }
