import settingsObject from "../Classes/settingsObject"

type groupKeysT = {
  colours: string[];
  widths: number[];
}

function getGroupKeys(inputSettings: settingsObject) {
  let l99_width: number = inputSettings.lines.width_99.value;
  let l95_width: number = inputSettings.lines.width_95.value;
  let target_width: number = inputSettings.lines.width_target.value;
  let alt_target_width: number = inputSettings.lines.width_alt_target.value;
  let l99_colour: string = inputSettings.lines.colour_99.value;
  let l95_colour: string = inputSettings.lines.colour_95.value;
  let target_colour: string = inputSettings.lines.colour_target.value;
  let alt_target_colour: string = inputSettings.lines.colour_alt_target.value;

  let lineColours: string[] = [
    l99_colour, l95_colour, l95_colour, l99_colour,
    target_colour, alt_target_colour
  ]

  let lineWidths: number[] = [
    l99_width, l95_width, l95_width, l99_width,
                  target_width, alt_target_width
  ]

  return {
    colours: lineColours,
    widths: lineWidths
  };
}

export default getGroupKeys;
export { groupKeysT }
