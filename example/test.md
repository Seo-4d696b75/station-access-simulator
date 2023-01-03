# Testing before Publish

npmにパッケージを公開する前にローカルで正しく使えるか確認する

## Installing as Node Module

`example`のプロジェクトで確認する

1. リンクを貼る in ライブラリの開発側
`npm link`

2. リンクを使う
`cd example && npm link ekimemo-access-simulator`

3. 動作確認
`npx ts-node src/main.ts`

3. 後処理
`npm unlink ekimemo-access-simulator`  
リンクを貼ったライブラリ開発側も
`npm unlink`

## Using via CDN

`cdn-test.html`をブラウザで開いて確認する

```html
<script language="javascript" type="text/javascript"
    src="path/to/simulator.min.js"></script>
```

- CDN(jsDelivr) `https://cdn.jsdelivr.net/npm/ekimemo-access-simulator@${version}/umd/simulator.min.js`
- ローカルファイル `umd/simulator.min.js`

DevToolsでバンドルされたファイルが正しくロードされている＆実行結果が正しくコンソールに出力されているのを確認