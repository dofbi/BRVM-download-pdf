import { Toolkit } from 'actions-toolkit'
import scrapeIt = require("scrape-it")
import moment from 'moment'

import fs from 'fs';
import path from 'path'
const { DownloaderHelper } = require('node-downloader-helper')

interface Inputs {
  'source-url': string
  'path': string
  [key: string]: string
}

console.log("---------------------Get Data---------------------")

function isToday(date: string) {
  let day = moment().diff(moment(date,'YYYY-MM-DD'),'days')
  let month = moment().diff(moment(date,'YYYY-MM-DD'),'months')
  let year = moment().diff(moment(date,'YYYY-MM-DD'),'years')
  if ((day===0) && (month===0) && (year===0)) return true
  return false
}

function createDirectories(pathname: string) {
   const __dirname = path.resolve();
   pathname = pathname.replace(/^\.*\/|\/?[^\/]+\.[a-z]+|\/$/g, ''); // Remove leading directory markers, and remove ending /file-name.extension
   fs.mkdir(path.resolve(__dirname, pathname), { recursive: true }, e => {
       if (e) {
           console.error(e);
       } else {
           console.log('Create Directory Success');
       }
    });
}

async function downloader(file: any,pathname: string) {
  console.log(file)
  pathname = `${pathname}/${moment(file.date,'YYYY-MM-DD').format('YYYY')}/${moment(file.date,'YYYY-MM-DD').format('MMMM')}`
  fs.access(path.resolve(__dirname, pathname), function(error) {
    if (error) {
      console.log("Directory does not exist.")
      createDirectories(pathname)
    } else {
      fs.access(path.resolve(__dirname, pathname,`${file.date}.pdf`), function(error) {
        if (error) {
          const download = new DownloaderHelper(file.url, path.resolve(__dirname, pathname),{
            fileName: `${file.date}.pdf`
          });
          download.on('end', () => console.log('Download Completed'))
          download.start()
        }else{
          console.log("File already download")
        }
      })
    }
  })
}

Toolkit.run<Inputs>(async tools => {
  // Prepare some options
  const sourceUrl = tools.inputs['source-url'] || 'https://www.brvm.org/en/bulletins-officiels-de-la-cote'
  const path = tools.inputs['path'] || '../data/pdf'

  scrapeIt(sourceUrl, {
    files: {
        listItem: "table > tbody > tr.odd.views-row-first"
        ,data: {
            date: {
            selector: "td.views-field.views-field-title",
            convert: date => moment(date.replace(/Daily Market Report - /g,''),'MMMM D YYYY').format("YYYY-MM-DD")
            },
            url: {
                selector: "a"
              , attr: "href"
            }
        }
    }
  }).then(({ data, response }) => {
      console.log(`Status Code: ${response.statusCode}`)
      if (isToday((data as {files: any }).files[0].date)){
        console.log((data as {files: any }).files[0].date)
        downloader((data as {files: any }).files[0],path)
      }
  })

})