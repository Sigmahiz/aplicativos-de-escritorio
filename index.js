const inquirer = require('inquirer')
require('colors')
const path = require('path')
const fs = require('fs')
const util = require('util')
const exec = util.promisify(require('child_process').exec)

const questions = [
  {
    type: 'list',
    name: 'option',
    message: '¿Cuál sistema operativo deseas compilar?'.cyan,
    choices: [
      {
        name: `${`1.`.green} Windows`,
        value: `win`
      },
      {
        name: `${`2.`.green} Linux`,
        value: `linux`
      },
      {
        name: `${`2.`.green} Mac`,
        value: `mac`
      }
    ]
  },
  {
    type: 'input',
    name: 'desc',
    message: 'Ingresa la url a compilar: '.cyan,
    validate(value) {
      if (value.length === 0) {
        return 'Please insert a value'
      }
      return true
    }
  },
  {
    type: 'input',
    name: 'title',
    message: 'Ingresa el nombre del aplicativo: '.cyan,
    validate(value) {
      if (value.length === 0) {
        return 'Please insert a value'
      }
      return true
    }
  }
]

const start = async () => {
  console.clear()
  console.log('==========================='.green)
  console.log('      SIGMA BUILD CLI      '.white)
  console.log('===========================\n'.green)

  const { option, desc, title } = await inquirer.prompt(questions)
  const envs = `
      VITE_URL=${desc}
      VITE_TITLE=${title}
  `
  fs.writeFileSync(path.join(__dirname, '.env'), envs)
  await runBuild(option)
}

const loaderFn = () => {
  const h = ['|', '/', '-', '\\']
  let i = 0

  return setInterval(() => {
    i = i > 3 ? 0 : i
    console.clear()
    console.log(h[i] + ' ' + 'Compilando...'.green)
    i++
  }, 300)
}

async function runBuild(option) {
  try {
    const loader = loaderFn()
    const { stdout } = await exec(`npm run build:${option}`)
    clearInterval(loader)
    console.clear()
    console.log(stdout)
    console.log('======================================'.green)
    console.log('  SIGMA BUILD COMPILADA CORRECTAMENTE  '.white)
    console.log('======================================'.green)
  } catch (e) {
    console.error(e) // should contain code (exit code) and signal (that caused the termination).
    console.log('SIGMA APP NO COMPILADA'.red)
  }
}

start()
