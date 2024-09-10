import { existsSync, readFileSync } from "fs";
import { convert } from "imagemagick";
import { parse } from "path";

const sprites = readApiJson("/api/v2/pokemon-species/")
  .results.map(({ url }) => readApiJson(url))
  .flatMap((species) => {
    const number = species.pokedex_numbers[0].entry_number;
    return species.varieties.map(({ pokemon }, i) => {
      const speciesName = species.name;
      const formName = pokemon.name;
      const name = i === 0 ? speciesName : formName;
      const imageNumber = pokemon.url.split("/")[4];
      const image = `sprites/sprites/pokemon/${imageNumber}.png`;
      return { name, formName, number, image };
    });
  });

for (const sprite of sprites) {
  const { name, formName, number, image } = sprite;
  const paddedNumber = getPaddedNumber(number);

  const directory = parse(image).name.length <= 4 ? "emoji" : "emoji/forms";
  const emojiName = getEmojiName(paddedNumber, name);
  const filename = `${emojiName}.png`;
  const output = `${directory}/${filename}`;

  if (name !== formName) {
    const formEmojiName = getEmojiName(paddedNumber, formName);
    console.log(`Create alias for ${formEmojiName} → ${emojiName}`);
  }

  if (existsSync(output)) {
    continue;
  }

  if (existsSync(image)) {
    convert([image, "-trim", "+repage", output], convertHandler);
  } else {
    console.error(`No sprite for '${name}'`);
  }
}

function readApiJson(path) {
  const filepath = `api-data/data${path}index.json`;
  const content = readFileSync(filepath);
  return JSON.parse(content);
}

function getPaddedNumber(number) {
  let paddedNumber = number.toString();
  while (paddedNumber.length < 3) {
    paddedNumber = "0" + paddedNumber;
  }
  return paddedNumber;
}

function getEmojiName(paddedNumber, name) {
  return `pokemon-${paddedNumber}-${name}`;
}

function convertHandler(err, stdout) {
  if (err) {
    throw err;
  }
  if (stdout) {
    console.log(stdout);
  }
}
