/* eslint-disable no-console */
const fs = require("fs");
const cliProgress = require("cli-progress");

const INPUT_PATH = "/home/alexgv/Desktop/Livro";

const OUTPUT_PATH = "/home/alexgv/Desktop/result";

function getFolderName(fileName) {
  try {
    const index = fileName.lastIndexOf("_");
    let fName = fileName
      .substring(index + 1)
      .toLowerCase()
      .replace(".pdf", "")
      .trim();
    if (fName.endsWith("a") && !Number.isNaN(fName.replace("a", ""))) {
      return "loteA";
    }
    if (fName.length > 6 || Number.isNaN(fName)) {
      return "remainder";
    }
    if (fName.length < 6) {
      fName = `000000${fName}`;
      fName = fName.substring(fName.length - 6);
    }
    if (fName === "000000") {
      console.log("fileName: ", fileName, fName);
    }
    return `${fName.substring(0, 3)}000`;
  } catch (err) {
    console.log("Error geting folder for ", fileName, "\n\n", err);
    return "errors";
  }
}

function copyFile(filePath) {
  const i1 = filePath.lastIndexOf("/");
  const dir = filePath.substring(0, i1);
  const file = filePath.substring(i1 + 1);
  const i2 = file.lastIndexOf("_");
  let fileName = `${file
    .substring(i2 + 1)
    .replace(".pdf", "")
    .trim()}.pdf`;

  const partes = dir.replace(`${INPUT_PATH}/`, "").split("/");
  const endsWithNumberRegex = /.*[0-9]$/;
  const notEndsWithNumber = partes.reduce(
    (acc, parte) => acc || !endsWithNumberRegex.test(parte),
    false
  );
  const folder = notEndsWithNumber ? "loteA" : getFolderName(fileName);
  if (fileName.length < 10) {
    fileName = `000000${fileName}`;
    fileName = fileName.substring(fileName.length - 10);
  }
  const newPath = `${OUTPUT_PATH}/${folder}/${fileName}`;
  if (!fs.existsSync(newPath)) {
    try {
      fs.copyFileSync(filePath, newPath, fs.constants.COPYFILE_EXCL);
    } catch (err) {
      try {
        const newPath2 = `${OUTPUT_PATH}/loteA/${fileName}`;
        fs.copyFileSync(filePath, newPath2, fs.constants.COPYFILE_EXCL);
      } catch (err2) {
        const newPath2 = `${OUTPUT_PATH}/loteA/${fileName}`;
        console.error(
          "Error copying file",
          filePath,
          "to",
          newPath2,
          "\n\n",
          err2
        );
      }
    }
  }
}

function createFolderStructure(dirs) {
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch (err) {
        console.error("Error creating folder", dir, "\n\n", err);
      }
    }
  }
  console.log(`estrutura de ${dirs.length} pastas criadas`);
}

function getFoldersAndFiles(dirPath, foldersAux, filesAux) {
  let folders = foldersAux;
  let files = filesAux;
  const items = fs.readdirSync(dirPath);
  items.forEach((item) => {
    if (fs.statSync(`${dirPath}/${item}`).isDirectory()) {
      [folders, files] = getFoldersAndFiles(
        `${dirPath}/${item}`,
        folders,
        files
      );
    } else if (item.toLowerCase().endsWith(".pdf")) {
      files.push(`${dirPath}/${item}`);
      const folder = getFolderName(item);
      if (!folders.includes(`${OUTPUT_PATH}/${folder}`)) {
        folders.push(`${OUTPUT_PATH}/${folder}`);
      }
    }
  });
  return [folders, files];
}

async function process() {
  const [dirs, files] = getFoldersAndFiles(INPUT_PATH, [OUTPUT_PATH], []);
  createFolderStructure(dirs);
  const progressBar = new cliProgress.SingleBar();
  const total = files.length;
  console.log("total de arquivos a copiar: ", total, "\n");
  progressBar.start(total, 0);
  for (let i = 0; i < total; i++) {
    const file = files[i];
    copyFile(file);
    progressBar.increment();
    // const perc = ((i / total) * 100).toFixed(2);
    // if (i !== 0 && i % 10000 === 0) {
    //   break;
    // }
  }
  progressBar.stop();
}
process();
