import Rize from 'rize'
const rize = new Rize()

rize
  .goto('https://github.com/')
  .type('input.header-search-input', 'node')
  .press('Enter')
  .waitForNavigation()
  .assertSee('Node.js')
  .end()  // Don't forget to call `end` function to exit browser!