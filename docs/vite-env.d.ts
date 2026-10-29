/// <reference types="vite/client" />

// rsform 的 CSS 副效入口（package.json exports 指向 .css），TS 需显式声明。
declare module 'rsform/styles';
