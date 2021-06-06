import config from '../config';
import * as Figma from 'figma-js';
import { promises as fs } from 'fs';
import startCase from 'lodash.startcase';
import path from 'path';

if (!config.figma.filename || !config.figma.personalAccessToken) {
  throw new Error(
    'You must have .env.local with FIGMA_PERSONAL_ACCESS_TOKEN and FIGMA_FILENAME'
  );
}

const figmaPersonalAccessToken = config.figma.personalAccessToken;
const figmaFilename = config.figma.filename;

const client = Figma.Client({ personalAccessToken: figmaPersonalAccessToken });
const filenameRegex = /([^//]*)_positive$/;
const metadataRegex = /([^/[]*) \[(.*)\]$/;

const ICONS_PATH = path.join(process.cwd(), 'public', 'icons');

function getMetadataFromDescription(name: string, description: string) {
  const metaData = description.match(metadataRegex);
  return metaData && metaData.length > 2
    ? {
        title: metaData[1],
        tags: metaData[2]
          .split(',')
          .map((tag) => tag.trim())
          .sort()
      }
    : {
        title: startCase(name),
        tags: []
      };
}

client.file(figmaFilename).then(({ data }) => {
  const metaDataArray = [];

  // look for icon components on the page "export"
  // with names that match the pattern: filled/{category}/{name}_positive
  data.document.children.map((child) => {
    if (child.type === 'CANVAS' && child.name === 'export') {
      child.children.map((component) => {
        if (
          component.type === 'COMPONENT' &&
          component.name.match(/^filled\//)
        ) {
          const idMatch = component.name.match(filenameRegex);
          if (idMatch) {
            const metaData = getMetadataFromDescription(
              idMatch[1],
              data.components[component.id].description
            );

            metaDataArray.push({
              id: idMatch[1],
              title: metaData.title,
              tags: metaData.tags
            });
          } else {
            console.log(`Incorrect id: ${component.name}`);
          }
        }

        return component;
      });
    }
    return child;
  });

  fs.writeFile(
    `${ICONS_PATH}/meta-data.json`,
    JSON.stringify(metaDataArray, null, ' ')
  );
});
