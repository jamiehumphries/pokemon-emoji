import { existsSync, readFileSync } from "fs";
import { convert } from "imagemagick";

const sprites = readApiJson("/api/v2/pokemon-form/")
  .results.map(({ url }) => readApiJson(url))
  .flatMap((form) => {
    const pokemon = readApiJson(form.pokemon.url);
    const species = readApiJson(pokemon.species.url);

    const number = species.pokedex_numbers[0].entry_number;

    const isDefault = pokemon.is_default && form.is_default;
    const speciesName = species.name;
    const formName = form.name;
    const name = isDefault ? speciesName : formName;

    const sprite = findSprite(form, pokemon, species);
    if (!sprite) {
      return null;
    }
    const image = sprite.replace(
      "https://raw.githubusercontent.com/PokeAPI/sprites/master",
      "sprites"
    );

    return { name, formName, isDefault, number, image };
  })
  .filter((sprite) => sprite !== null)
  .filter(({ name }) => name.indexOf("-totem") === -1);

for (const sprite of sprites) {
  const { name, formName, number, image } = sprite;
  const paddedNumber = getPaddedNumber(number);

  const emojiName = getEmojiName(paddedNumber, name);
  const output = `emoji/${emojiName}.png`;

  if (existsSync(output)) {
    continue;
  }

  if (name !== formName) {
    const formEmojiName = getEmojiName(paddedNumber, formName);
    console.log(`Create alias for ${formEmojiName} → ${emojiName}`);
  }

  if (existsSync(image)) {
    convert([image, "-trim", "+repage", output], convertHandler);
  } else {
    console.error(`Could not find sprite for '${name}'`);
  }
}

function readApiJson(path) {
  const filepath = `api-data/data${path}index.json`;
  const content = readFileSync(filepath);
  return JSON.parse(content);
}

function findSprite(form, pokemon, species) {
  if (form.sprites.front_default) {
    return form.sprites.front_default;
  }

  const isSpeciesVariety =
    species.varieties.find(({ pokemon }) => pokemon.name === form.name) !==
    undefined;

  return isSpeciesVariety ? pokemon.sprites.front_default : null;
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
