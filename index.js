// import Docker from "dockerode"
// import fs from "fs"
// import path from "path"
// import tar from "tar-stream"
// import readline from "readline"
// import chalk from "chalk"
const Docker = require("dockerode")
const fs = require("fs")
const path = require("path")
const tar = require("tar-stream")
const readline = require("readline")


const DATABASE_PATH = "/app/src/static/database.db"
const AVATARS_PATH = "/app/src/static/avatars/custom"
const ENV_PATH = "/app/.env"

const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const CYAN = '\x1b[36m';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})


const question = (text) => new Promise((resolve) => rl.question(text, resolve));


async function copyFiles(containerFilePath, container, extractPath, name) {
    try {
        const stream = await container.getArchive({ path: containerFilePath})
        const extract = tar.extract()

        extract.on("entry", (header, stream, next) => {
            const filePath = path.join(extractPath, header.name)

            if(header.type === "directory") {
                fs.mkdirSync(filePath, { recursive: true})
                stream.resume()
            } else {
                stream.pipe(fs.createWriteStream(filePath))
            }
            stream.on("end", next)
        })

        extract.on("finish", () => {
            // console.log(chalk.green(`${container.id}`) + ":" + chalk.cyan(`${name}`) + ` => extraction terminée`)
            console.log(`${GREEN}${container.id}${RESET}:${CYAN}${name}${RESET} => extraction terminée`)
            // console.log("ter")
        })

        stream.pipe(extract)
    } catch(err) {
        console.error(err)
    }
}

async function main() {

    const backContainerId = await question("Entrez le nom ou l'id du conteneur Docker correspondant au serveur BACKEND de Oneblind: ")
    const frontContainerId = await question("Entrez le nom ou l'id du conteneur Docker correspondant au serveur FRONTEND de Oneblind: ")
    const extractPath = await question("Entrez le chemin de destination des fichiers: ")
    console.log("\n")

    const docker = new Docker({ host: '127.0.0.1', port: 2375 });
    const backContainer = docker.getContainer(backContainerId);
    const frontContainer = docker.getContainer(frontContainerId)
    
    await copyFiles(DATABASE_PATH, backContainer, extractPath, "database")
    await copyFiles(AVATARS_PATH, backContainer, extractPath, "avatars")
    await copyFiles(ENV_PATH, frontContainer, extractPath, "env")

    process.stdin.resume();

}

main()