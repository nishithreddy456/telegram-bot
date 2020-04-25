const Telegraf = require('telegraf')
const Markup = require("telegraf/markup");
const Stage = require("telegraf/stage");
const session = require("telegraf/session");
const WizardScene = require("telegraf/scenes/wizard");
const Extra=require('telegraf/extra')
const loveCalculator = require("./loveCalculator");

const bot = new Telegraf(process.env.BOT_TOKEN)
bot.use(Telegraf.log())

bot.hears('markdown',ctx=>ctx.reply(
`*bold text*
_italic text_
[inline URL](http://www.example.com/)
[inline mention of a user](tg://user?id=123456789)
\`inline fixed-width code\`
\`\`\`block_language
pre-formatted fixed-width code block
\`\`\`
`,Extra.markdown()));
bot.command('html',ctx=>ctx.reply(`<b>bold</b>, <strong>bold</strong>
<i>italic</i>, <em>italic</em>
<u>underline</u>, <ins>underline</ins>
<s>strikethrough</s>, <strike>strikethrough</strike>, <del>strikethrough</del>
<b>bold <i>italic bold <s>italic bold strikethrough</s> <u>underline italic bold</u></i> bold</b>
<a href="https://loremflickr.com/320/240/paris">inline URL</a>
<a href="tg://user?id=123456789">inline mention of a user</a>
<code>inline fixed-width code</code>
<pre>pre-formatted fixed-width code block</pre>`,Extra.HTML().webPreview(false)));
bot.command('custom',ctx=>ctx.reply('keyboard',Markup.keyboard(
[['Dog','Cat'],
['Bear','Monkey','Bird']])
                                   .resize()
                                   .extra()))
bot.hears('Dog',ctx=>ctx.reply(`<a href="${random('dog')}">DOG</a>`,Extra.HTML()));
bot.hears('Cat',ctx=>ctx.reply(`<a href="${random('cat')}">CAT</a>`,Extra.HTML()));
bot.hears('Bear',ctx=>ctx.reply(`<a href="${random('bear')}">Bear</a>`,Extra.HTML()));
bot.hears('Monkey',ctx=>ctx.reply(`<a href="${random('monkey')}">Mokey</a>`,Extra.HTML()));
bot.hears('Bird',ctx=>ctx.reply(`<a href="${random('bird')}">Bird</a>`,Extra.HTML()));
const random=tag=>{
  let imgId=Math.trunc(Math.random()*1000)
  let url=`https://loremflickr.com/320/240/${tag}/?lock=${imgId}`
  return url
} 
//Inline keyboard
bot.command('inline',ctx=>ctx.reply(`Random image <a href="${random('dog')}">DOG</a>`,
                                    Extra.HTML().markup((m)=>m.inlineKeyboard([m.callbackButton('Next Image','dog'),
                                                                              m.callbackButton('Next Image','do')]))));
bot.action('dog',ctx=>ctx.editMessageText(`Random image <a href="${random('dog')}">DOG</a>`,
                                    Extra.HTML().markup((m)=>m.inlineKeyboard([m.callbackButton('Next Image','dog')]))))


bot.start((ctx) => ctx.reply('Welcome!'))
bot.help((ctx) => ctx.reply('Send me a sticker'))
bot.on('sticker', (ctx) => ctx.reply('👍'))
bot.hears('hi', (ctx) => ctx.reply('Hey there'))
bot.command('oldschool', (ctx) => ctx.reply('Hello'))
bot.command('modern', ({ reply }) => reply('Yo'))
bot.command('hipster', Telegraf.reply('λ'))
//bot.on('text',ctx=>{
  //ctx.reply('Hello')
  //console.log('update\n',ctx.update)
  //console.log("from\n",ctx.from)
//});
bot.command('check',(ctx) => {
  ctx.reply(
    `Hello ${ctx.from.first_name}, would you like to know the love compatibility?`,
    Markup.inlineKeyboard([
      Markup.callbackButton("Love Calculate", "LOVE_CALCULATE")
    ]).extra()
  );
});

// love calculator two-step wizard
const loveCalculate = new WizardScene(
  "love_calculate",
  ctx => {
    ctx.reply("Please, enter your name"); // enter your name
    return ctx.wizard.next();
  },
  ctx => {
    ctx.wizard.state.yourName = ctx.message.text; // store yourName in the state to share data between middlewares
    ctx.reply(
      "Enter the name of your partner/lover/crush to find Love compatibility & chances of successful love relationship."
    );
    return ctx.wizard.next();
  },
  ctx => {
    const partnerName = ctx.message.text; // retrieve partner name from the message which user entered
    const yourName = ctx.wizard.state.yourName; // retrieve your name from state
    loveCalculator
      .getPercentage(yourName, partnerName)
      .then(res => {
        const { fname, sname, percentage, result } = res.data;
        ctx.reply(
          `${fname} + ${sname} = ${percentage}% \n ${percentage > 50 ? '☺️' : '😢'} ${result}`,
          Markup.inlineKeyboard([
            Markup.callbackButton(
              "♥️ calculate Another Relationship",
              "LOVE_CALCULATE"
            )
          ]).extra()
        );
      })
      .catch(err => ctx.reply(
        err.message,
        Markup.inlineKeyboard([
          Markup.callbackButton("calculate again", "LOVE_CALCULATE")
        ]).extra()
      ));
    return ctx.scene.leave();
  }
);

const stage = new Stage([loveCalculate], { default: "love_calculate" }); // Scene registration
bot.use(session());
bot.use(stage.middleware());
bot.launch()