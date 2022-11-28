# 時刻の扱い

## 時刻の表現方法
ライブラリ内の各状態では時刻を`number`型のUnix Timestamp (ms)として保持しています.  

**タイムゾーンに関する情報は持っていません** 時刻を参照・処理する側の対応が必要です
```ts
interface SomeState {
    time: number
}
```


## 現在時刻の参照
プログラムを実行する時刻とは異なる時刻を指定してシミュレーションしたいケースは多いです. シミュレーション中の"現在時刻"はすべて`Context`を通じて参照されます.  


```js
import { initContext, Context } from "ekimemo-access-simulator";

const context: Context = initContext("this is test", "random seed", true)
console.log(context.clock) // "now"（デフォルト値）
console.log(context.currentTime) // `dayjs()`でプログラム実行中の現在時刻が参照されます

// 特定の時間を指定
context.clock = dayjs('2022-01-01T12:00:00+0900').valueOf()
context.setClock('2022-01-01T12:00:00+0900') // どっちでもOK
console.log(context.currentTime) // 1641006000000

// 以降の処理はすべて指定の時刻を参照する

```

**タイムゾーンの指定を推奨！** 

`dayjs()`でパースするとき、タイムゾーンの指定が無い文字列表現だとプログラムの実行環境に依存したタイムゾーンで解釈されます. `Asia/Tokyo`以外の環境でパースすときはタイムゾーンを明示的に指定しないと意図しない動作になるおそれがあります.

```js
context.clock = dayjs('2022-01-01T12:00:00+0900').valueOf()
context.clock = dayjs.tz('2022-01-01T12:00:00', 'Asia/Tokyo').valueOf()
```

## タイムゾーンの扱い
時間帯に応じて効果内容が変化するスキルの発動など、タイムゾーンに依存する処理が多く存在します. ライブラリ内部ではすべて`Asia/Tokyo +0900`として処理しています

#### dayjs.tzによる実装

ライブラリではデフォルトのタイムゾーンを指定しています
```js
dayjs.tz.setDefault("Asia/Tokyo")
```

タイムゾーンを省略することができます

```js
// ライブラリ内では同じ結果になる
context.clock = dayjs.tz('2022-01-01T12:00:00', 'Asia/Tokyo').valueOf()
context.clock = dayjs.tz('2022-01-01T12:00:00').valueOf()
```

ライブラリ内部の処理では必ず`Context`オブジェクトが与えられるので、次のようにタイムゾーンを考慮して時刻を処理します

```js
import dayjs from 'dayjs';
import { Context } from './path/to/index';

function someFunction(context: Context, state: SomeState) {
  const now = dayjs.tz(context.currentTime)
  const hour = now.hour() // 1日のうち今何時か？（0-23）
  if(6 <= hour && hour < 18) {
    // お昼の時間帯の処理
  }
}
```

#### dayjs.tzの初期化

ソースのルート`index.ts`で初期化されています. 

外部からライブラリを使用する場合は`import * from "ekimemo-access-simulator";`が評価されるタイミングで初期化されますが、ライブラリ内部で`dayjs.tz`を使用する場合は`index.ts`を必ずimportする必要があります. 

```js
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.tz.setDefault(SIMULATOR_TIME_ZONE)
```