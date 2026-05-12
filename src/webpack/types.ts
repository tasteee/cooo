export type LoaderOptions = Record<string, unknown>;

export type LoaderUserObjectT = {
  loader: string;
  options?: LoaderOptions;
};

export type LoaderUseT = string | LoaderUserObjectT;

export type WebpackLoaderRuleT = {
  test?: RegExp;
  issuer?: RegExp;
  include?: string | RegExp | Array<string | RegExp>;
  exclude?: RegExp | Array<string | RegExp>;
  enforce?: "pre" | "post";
  type?:
    | "asset"
    | "asset/inline"
    | "asset/resource"
    | "asset/source"
    | "javascript/auto"
    | "webassembly/async";
  parser?: LoaderOptions;
  generator?: LoaderOptions;
  use?: LoaderUseT | LoaderUseT[];
  loader?: string;
  options?: LoaderOptions;
  oneOf?: WebpackLoaderRuleT[];
  resourceQuery?: RegExp | { not: RegExp[] };
  dependency?: { not: string[] };
};
