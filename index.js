import { existsSync, readFileSync } from "fs";
import { globSync } from "glob";
import { convert } from "imagemagick";
import { parse } from "path";

const sprites = globSync("sprites/sprites/pokemon/*.png").filter((path) =>
  path.match(/\/[1-9]\d{0,3}\.png$/g)
);

for (const sprite of sprites) {
  const number = parse(sprite).name;
  const paddedNumber = getPaddedNumber(number);
  const name = getName(number);

  const output = `emoji/pokemon-${paddedNumber}-${name}.png`;
  if (existsSync(output)) {
    continue;
  }

  convert([sprite, "-trim", "+repage", output], convertHandler);
}

function getPaddedNumber(number) {
  let paddedNumber = number;
  while (paddedNumber.length < 3) {
    paddedNumber = "0" + paddedNumber;
  }
  return paddedNumber;
}

function getName(number) {
  const apiFilepath = `api-data/data/api/v2/pokemon/${number}/index.json`;
  const content = readFileSync(apiFilepath);
  const json = JSON.parse(content);
  return json.name;
}

function convertHandler(err, stdout) {
  if (err) {
    throw err;
  }
  if (stdout) {
    console.log(stdout);
  }
}
