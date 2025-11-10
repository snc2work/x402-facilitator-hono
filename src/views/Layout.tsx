import type { FC, PropsWithChildren } from "hono/jsx";

export const Layout: FC<PropsWithChildren<{ title: string }>> = (props) => {
  return (
    <html lang="ja" className="dark">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{props.title}</title>
        <link href="/styles.css" rel="stylesheet" />
      </head>
      <body>{props.children}</body>
    </html>
  );
};
