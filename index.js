import {
  appendFileSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "fs";
import { convert } from "imagemagick";

const forms = readApiJson("/api/v2/pokemon-form/")
  .results.map(({ url }) => readApiJson(url))
  .flatMap((form) => {
    const pokemon = readApiJson(form.pokemon.url);
    const species = readApiJson(pokemon.species.url);

    const number = species.pokedex_numbers[0].entry_number;

    const isDefault = pokemon.is_default && form.is_default;
    const speciesName = species.name;
    const fullName = form.name;
    const name = isDefault ? speciesName : fullName;

    const spriteTypes = ["default", "female", "shiny", "shiny_female"];

    return spriteTypes.map((type) => {
      const sprite = findSpriteImage(form, pokemon, species, type);
      if (!sprite) {
        return null;
      }
      const image = sprite.replace(
        "https://raw.githubusercontent.com/PokeAPI/sprites/master",
        "sprites"
      );
      return {
        name: modifiedName(name, type),
        fullName: modifiedName(fullName, type),
        isDefault,
        number,
        image,
      };
    });
  })
  .filter((form) => !!form)
  .filter(({ name }) => name.indexOf("-totem") === -1);

const outputDirectory = "emoji";
const timestamp = new Date().toISOString().replace(/[^\d]/g, "").slice(0, -3);
const newEmojiDirectory = `${outputDirectory}/new-${timestamp}`;
const newAliasesFile = `${newEmojiDirectory}/aliases.txt`;
mkdirSync(newEmojiDirectory);
writeFileSync(newAliasesFile, "");

for (const form of forms) {
  const { name, fullName, number, image } = form;
  const paddedNumber = getPaddedNumber(number);

  const emojiName = getEmojiName(paddedNumber, name);
  const fileName = `${emojiName}.png`;
  const output = `${outputDirectory}/${fileName}`;

  if (existsSync(output)) {
    continue;
  }

  if (name !== fullName) {
    const formEmojiName = getEmojiName(paddedNumber, fullName);
    const alias = `${formEmojiName} → ${emojiName}`;
    console.log(`Create alias ${alias}`);
    appendFileSync(newAliasesFile, `${alias}\n`);
  }

  if (existsSync(image)) {
    convert([image, "-trim", "+repage", "-strip", output], (err, stdout) => {
      if (err) {
        throw err;
      }
      if (stdout) {
        console.log(stdout);
      }
      copyFileSync(output, `${newEmojiDirectory}/${fileName}`);
    });
  } else {
    console.error(`Could not find sprite for '${name}'`);
  }
}

function readApiJson(path) {
  const filepath = `api-data/data${path}index.json`;
  const content = readFileSync(filepath);
  return JSON.parse(content);
}

function findSpriteImage(form, pokemon, species, type) {
  const typeProperty = `front_${type}`;

  const formImage = form.sprites[typeProperty];
  if (formImage) {
    return formImage;
  }

  const isSpeciesVariety =
    species.varieties.find(({ pokemon }) => pokemon.name === form.name) !==
    undefined;

  return isSpeciesVariety ? pokemon.sprites[typeProperty] : null;
}

function modifiedName(baseName, type) {
  return type === "default"
    ? baseName
    : `${baseName}-${type.replaceAll("_", "-")}`;
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
