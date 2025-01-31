import tsloader from "../ts-loader.js";
import { describe, it, expect } from "vitest";

const loaderContext = {
  _compilation: {},
  resourcePath: "/some/special/path/page.tsx",
  rootContext: "/some",
  mode: "development",
  importModule: () => {
    return {
      replaces: {
        queries: {
          sm: "@media (min-width: 640px)",
          md: "@media (min-width: 768px)",
          lg: "@media (min-width: 1024px)",
          xl: "@media (min-width: 1280px)",
          xxl: "@media (min-width: 1536px)",
        },
      },
    };
  },
  getOptions: () => ({
    configPath: "/some/special/path/config",
  }),
  async: () => (err, result) => {
    if (err) {
      throw err;
    }
    return result;
  },
};

describe("tsloader", () => {
  // snapshot
  it("should return the correct value", async () => {
    expect(
      await tsloader.call(
        loaderContext,
        `
    "use client";
    import styles from "./page.module.css";
    import { css } from "next-yak";

    type x = number;

const headline = css\`
  font-size: 2rem;
  font-weight: bold;
  color: blue;
  &:hover {
    color: red;
  }
        \`;

export const Main = () => <h1 className={headline({}).className}>Hello World</h1>;
`,
      ),
    ).toMatchInlineSnapshot(`
      "\\"use client\\";

      import styles from \\"./page.module.css\\";
      import { css } from \\"next-yak/internal\\";
      import __styleYak from \\"./page.yak.module.css!=!./page?./page.yak.module.css\\";
      type x = number;
      const headline =
      /*YAK Extracted CSS:
      .headline {
        font-size: 2rem;
        font-weight: bold;
        color: blue;
        &:hover {
          color: red;
        }
      }*/
      /*#__PURE__*/
      css(__styleYak.headline);
      export const Main = () => <h1 className={headline({}).className}>Hello World</h1>;"
    `);
  });
  it("should support nested css code", async () => {
    expect(
      await tsloader.call(
        loaderContext,
        `
import styles from "./page.module.css";
import { css } from "next-yak";

const x = Math.random();
const headline = css\`
  font-size: 2rem;
  font-weight: bold;
  color: red;
  \${x > 0.5 && css\`
    color: blue;
  \`}
  &:hover {
    color: red;
  }
\`;
`,
      ),
    ).toMatchInlineSnapshot(`
      "import styles from \\"./page.module.css\\";
      import { css } from \\"next-yak/internal\\";
      import __styleYak from \\"./page.yak.module.css!=!./page?./page.yak.module.css\\";
      const x = Math.random();
      const headline =
      /*YAK Extracted CSS:
      .headline {
        font-size: 2rem;
        font-weight: bold;
        color: red;
      }
      .headline__headline {
        color: blue;
      }
      .headline {
        &:hover {
          color: red;
        }
      }*/
      /*#__PURE__*/
      css(__styleYak.headline, x > 0.5 && /*#__PURE__*/css(__styleYak.headline__headline));"
    `);
  });

  it("should support styled api", async () => {
    expect(
      await tsloader.call(
        loaderContext,
        `
import styles from "./page.module.css";
import { styled, css } from "next-yak";

const x = Math.random();
const Button = styled.button\`
  font-size: 2rem;
  font-weight: bold;
  color: red;
  \${x > 0.5 && css\`
    color: blue;
  \`}
  &:hover {
    color: red;
  }
\`;
const FancyButton = styled(Button)\`
  background-color: green;
\`;
`,
      ),
    ).toMatchInlineSnapshot(`
      "import styles from \\"./page.module.css\\";
      import { styled, css } from \\"next-yak/internal\\";
      import __styleYak from \\"./page.yak.module.css!=!./page?./page.yak.module.css\\";
      const x = Math.random();
      const Button =
      /*YAK Extracted CSS:
      .Button {
        font-size: 2rem;
        font-weight: bold;
        color: red;
      }
      .Button__Button {
        color: blue;
      }
      .Button {
        &:hover {
          color: red;
        }
      }*/
      /*#__PURE__*/
      styled.button(__styleYak.Button, x > 0.5 && /*#__PURE__*/css(__styleYak.Button__Button));
      const FancyButton =
      /*YAK Extracted CSS:
      .FancyButton {
        background-color: green;
      }*/
      /*#__PURE__*/
      styled(Button)(__styleYak.FancyButton);"
    `);
  });

  it("should support nested selectors", async () => {
    expect(
      await tsloader.call(
        loaderContext,
        `
        import { styled, css } from "next-yak";

        const Button = styled.button\`
          font-size: 2rem;
          font-weight: bold;
        
          .Icon {
            \${({$primary}) => $primary 
              ? css\`background: black;\` 
              : css\`background: white;\`
            }
            width: \${({$iconWidth}) => $iconWidth}px;
          }
        
          display: block;
        \`;
        const FancyButton = styled(Button)\`
          background-color: green;
        \`;
`,
      ),
    ).toMatchInlineSnapshot(`
      "import { styled, css, __yak_unitPostFix } from \\"next-yak/internal\\";
      import __styleYak from \\"./page.yak.module.css!=!./page?./page.yak.module.css\\";
      const Button =
      /*YAK Extracted CSS:
      .Button {
        font-size: 2rem;
        font-weight: bold;
      }
      .Button__$primary {
        .Icon {
          background: black;
        }
      }
      .Button__not_$primary {
        .Icon {
          background: white;
        }
      }
      .Button {
        .Icon {
          width: var(--Button__width_18fi82j);
        }
        display: block;
      }*/
      /*#__PURE__*/
      styled.button(__styleYak.Button, ({
        $primary
      }) => $primary ? /*#__PURE__*/css(__styleYak.Button__$primary) : /*#__PURE__*/css(__styleYak.Button__not_$primary), {
        \\"style\\": {
          \\"--Button__width_18fi82j\\": __yak_unitPostFix(({
            $iconWidth
          }) => $iconWidth, \\"px\\")
        }
      });
      const FancyButton =
      /*YAK Extracted CSS:
      .FancyButton {
        background-color: green;
      }*/
      /*#__PURE__*/
      styled(Button)(__styleYak.FancyButton);"
    `);
  });

  it("should support access to the theme", async () => {
    expect(
      await tsloader.call(
        loaderContext,
        `
import styles from "./page.module.css";
import { styled, css } from "next-yak";

const x = Math.random();
const Button = styled.button\`
  font-size: 2rem;
  font-weight: bold;
  color: red;
  \${({theme}) => theme.mode === "dark" && css\`
    color: blue;
  \`}
  &:hover {
    color: red;
  }
\`;
const FancyButton = styled(Button)\`
  background-color: green;
\`;
`,
      ),
    ).toMatchInlineSnapshot(`
      "import styles from \\"./page.module.css\\";
      import { styled, css } from \\"next-yak/internal\\";
      import __styleYak from \\"./page.yak.module.css!=!./page?./page.yak.module.css\\";
      const x = Math.random();
      const Button =
      /*YAK Extracted CSS:
      .Button {
        font-size: 2rem;
        font-weight: bold;
        color: red;
      }
      .Button__Button {
        color: blue;
      }
      .Button {
        &:hover {
          color: red;
        }
      }*/
      /*#__PURE__*/
      styled.button(__styleYak.Button, ({
        theme
      }) => theme.mode === \\"dark\\" && /*#__PURE__*/css(__styleYak.Button__Button));
      const FancyButton =
      /*YAK Extracted CSS:
      .FancyButton {
        background-color: green;
      }*/
      /*#__PURE__*/
      styled(Button)(__styleYak.FancyButton);"
    `);
  });

  it("should support attrs on intrinsic elements", async () => {
    expect(
      await tsloader.call(
        loaderContext,
        `
import { styled } from "next-yak";

const headline = styled.input.attrs({
  type: "text",
})\`
  color: red;
  \`;
`,
      ),
    ).toMatchInlineSnapshot(`
      "import { styled } from \\"next-yak/internal\\";
      import __styleYak from \\"./page.yak.module.css!=!./page?./page.yak.module.css\\";
      const headline =
      /*YAK Extracted CSS:
      .headline {
        color: red;
      }*/
      /*#__PURE__*/
      styled.input.attrs({
        type: \\"text\\"
      })(__styleYak.headline);"
    `);
  });

  it("should support attrs on wrapped elements", async () => {
    expect(
      await tsloader.call(
        loaderContext,
        `
import { styled } from "next-yak";

const headline = styled.input\`
  color: red;
\`;

const newHeadline = styled(headline).attrs({
  type: "text",
})\`
  color: black;
  \`;
`,
      ),
    ).toMatchInlineSnapshot(`
      "import { styled } from \\"next-yak/internal\\";
      import __styleYak from \\"./page.yak.module.css!=!./page?./page.yak.module.css\\";
      const headline =
      /*YAK Extracted CSS:
      .headline {
        color: red;
      }*/
      /*#__PURE__*/
      styled.input(__styleYak.headline);
      const newHeadline =
      /*YAK Extracted CSS:
      .newHeadline {
        color: black;
      }*/
      /*#__PURE__*/
      styled(headline).attrs({
        type: \\"text\\"
      })(__styleYak.newHeadline);"
    `);
  });

  it("should support css variables with spaces", async () => {
    expect(
      await tsloader.call(
        loaderContext,
        `
import styles from "./page.module.css";
import { css } from "next-yak";
import { easing } from "styleguide";

const headline = css\`
  transition: color \${({i}) => i * 100 + "ms"} \${({easing}) => easing};
  display: block;
  \${css\`color: orange\`}
  \${css\`color: blue\`}
  \`;
`,
      ),
    ).toMatchInlineSnapshot(`
      "import styles from \\"./page.module.css\\";
      import { css } from \\"next-yak/internal\\";
      import __styleYak from \\"./page.yak.module.css!=!./page?./page.yak.module.css\\";
      import { easing } from \\"styleguide\\";
      const headline =
      /*YAK Extracted CSS:
      .headline {
        transition: color var(--headline__transition_18fi82j) var(--headline__transition_18fi82j_1);
        display: block;
      }
      .headline__headline {
        color: orange;
      }
      .headline__headline_1 {
        color: blue;
      }*/
      /*#__PURE__*/
      css(__styleYak.headline, css\`color: orange\`, css\`color: blue\`, {
        \\"style\\": {
          \\"--headline__transition_18fi82j\\": ({
            i
          }) => i * 100 + \\"ms\\",
          \\"--headline__transition_18fi82j_1\\": ({
            easing
          }) => easing
        }
      });"
    `);
  });

  it("should convert keyframes", async () => {
    expect(
      await tsloader.call(
        loaderContext,
        `
import styles from "./page.module.css";
import { styled, keyframes } from "next-yak";

const fadeIn = keyframes\`
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
\`

const FadeInButton = styled.button\`
  animation: 1s \${fadeIn} ease-out 1s infinite reverse both paused slidein;
\`
`,
      ),
    ).toMatchInlineSnapshot(`
      "import styles from \\"./page.module.css\\";
      import { styled, keyframes } from \\"next-yak/internal\\";
      import __styleYak from \\"./page.yak.module.css!=!./page?./page.yak.module.css\\";
      const fadeIn =
      /*YAK Extracted CSS:
      @keyframes fadeIn {
        0% {
          opacity: 0;
        }
        100% {
          opacity: 1;
        }
      }*/
      /*#__PURE__*/
      keyframes(__styleYak.fadeIn);
      const FadeInButton =
      /*YAK Extracted CSS:
      .FadeInButton {
        animation: 1s fadeIn ease-out 1s infinite reverse both paused slidein;
      }*/
      /*#__PURE__*/
      styled.button(__styleYak.FadeInButton);"
    `);
  });

  it("should allow to target components", async () => {
    expect(
      await tsloader.call(
        loaderContext,
        `
import { styled, keyframes } from "next-yak";

const Link = styled.a\`
  color: palevioletred;
\`

const Icon = styled.svg\`
  fill: currentColor;
  width: 1em;
  height: 1em;
  \${Link}:hover & {
    color: red;
  }
  \${Link}:focus & {
    color: red;
  }
\`

const Wrapper = styled.div\`
  &:has(> \${Link}) {
    padding: 10px;
  }
\`

`,
      ),
    ).toMatchInlineSnapshot(`
      "import { styled, keyframes } from \\"next-yak/internal\\";
      import __styleYak from \\"./page.yak.module.css!=!./page?./page.yak.module.css\\";
      const Link =
      /*YAK Extracted CSS:
      .Link {
        color: palevioletred;
      }*/
      /*#__PURE__*/
      styled.a(__styleYak.Link);
      const Icon =
      /*YAK Extracted CSS:
      .Icon {
        fill: currentColor;
        width: 1em;
        height: 1em;
        .Link:hover & {
          color: red;
        }
        .Link:focus & {
          color: red;
        }
      }*/
      /*#__PURE__*/
      styled.svg(__styleYak.Icon);
      const Wrapper =
      /*YAK Extracted CSS:
      .Wrapper {
        &:has(> .Link) {
          padding: 10px;
        }
      }*/
      /*#__PURE__*/
      styled.div(__styleYak.Wrapper);"
    `);
  });

  it("should allow to target components even if they don't have styles", async () => {
    expect(
      await tsloader.call(
        loaderContext,
        `
import { styled, keyframes } from "next-yak";

const Link = styled.a\`
\`

const Icon = styled.svg\`
\`

const Text = styled.span\`
\`

const Wrapper = styled.div\`
  color: red;
  &:has(> \${Icon}),
  &:has(> \${Link}) {
    padding: 10px;
  }
\`

`,
      ),
    ).toMatchInlineSnapshot(`
      "import { styled, keyframes } from \\"next-yak/internal\\";
      import __styleYak from \\"./page.yak.module.css!=!./page?./page.yak.module.css\\";
      const Link =
      /*YAK Extracted CSS:
      .Link {}
      */
      /*#__PURE__*/
      styled.a(__styleYak.Link);
      const Icon =
      /*YAK Extracted CSS:
      .Icon {}
      */
      /*#__PURE__*/
      styled.svg(__styleYak.Icon);
      const Text = /*#__PURE__*/styled.span();
      const Wrapper =
      /*YAK Extracted CSS:
      .Wrapper {
        color: red;
        &:has(> .Icon),
      &:has(> .Link) {
          padding: 10px;
        }
      }*/
      /*#__PURE__*/
      styled.div(__styleYak.Wrapper);"
    `);
  });

  it("should allow to use queries", async () => {
    expect(
      await tsloader.call(
        loaderContext,
        `import { css } from "next-yak";
        import { queries } from "@/theme/constants.yak";
        const headline = css\`
        @media (min-width: 640px) {
          font-size: 1.5rem;
          \${({ $primary }) =>
            $primary &&  css\`font-size: 1.7rem;\`}
        }

  &:before {
    content: "\\2022";
  }
  \``,
      ),
    ).toMatchInlineSnapshot(`
      "import { css } from \\"next-yak/internal\\";
      import __styleYak from \\"./page.yak.module.css!=!./page?./page.yak.module.css\\";
      import { queries } from \\"@/theme/constants.yak\\";
      const headline =
      /*YAK Extracted CSS:
      .headline {
        @media (min-width: 640px) {
          font-size: 1.5rem;
        }
      }
      .headline__$primary {
        @media (min-width: 640px) {
          font-size: 1.7rem;
        }
      }
      .headline {
        &:before {
          content: \\"\\\\2022\\";
        }
      }*/
      /*#__PURE__*/
      css(__styleYak.headline, ({
        $primary
      }) => $primary && /*#__PURE__*/css(__styleYak.headline__$primary));"
    `);
  });

  it("should show error when mixin is used in nested selector", async () => {
    await expect(() =>
      tsloader.call(
        loaderContext,
        `
import { styled, css } from "next-yak";

const bold = css\`
  font-weight: bold;
\`

const Icon = styled.div\`
  @media (min-width: 640px) {
    .bar {
      \${bold}
    }
  }
\`
`,
      ),
    ).rejects.toThrowErrorMatchingInlineSnapshot(`
      "/some/special/path/page.tsx: line 11: Mixins are not allowed inside nested selectors
      found: \${bold}
      Use an inline css literal instead or move the selector into the mixin"
    `);
  });

  it("should show error when a mixin function is used in nested selector", async () => {
    await expect(() =>
      tsloader.call(
        loaderContext,
        `
import { styled, css } from "next-yak";

const bold = () => css\`
  font-weight: bold;
\`

const Icon = styled.div\`
  @media (min-width: 640px) {
    .bar {
      \${bold()}
    }
  }
\`
`,
      ),
    ).rejects.toThrowErrorMatchingInlineSnapshot(`
      "/some/special/path/page.tsx: line 11: Mixins are not allowed inside nested selectors
      found: \${bold()}
      Use an inline css literal instead or move the selector into the mixin"
    `);
  });

  // TODO: this test was temporarily disabled because it was failing when inline css literals were introduced
  it.skip("should show error when mixin is used in nested selector inside a css", async () => {
    await expect(() =>
      tsloader.call(
        loaderContext,
        `
import { styled, css } from "next-yak";

const bold = css\`
  font-weight: bold;
\`

const Icon = styled.div\`
  @media (min-width: 640px) {
    .bar {
      \${() => css\`\${bold}\`}
    }
  }
\`
`,
      ),
    ).rejects.toThrowErrorMatchingInlineSnapshot(`
      "/some/special/path/page.tsx: line 11: Mixins are not allowed inside nested selectors
      found: \${bold}
      Use an inline css literal instead or move the selector into the mixin"
    `);
  });
  it("should show error when a dynamic selector is used", async () => {
    await expect(() =>
      tsloader.call(
        loaderContext,
        `
import { styled, css } from "next-yak";
import { test } from "another-module";

const Icon = styled.div\`
  \${test} {
    font-weight: bold;
  }
\`
`,
      ),
    ).rejects.toThrowErrorMatchingInlineSnapshot(`
      "/some/special/path/page.tsx: line 6: Module constants are not allowed in this context
      found: \${test}
      Use the 'experiments.crossFileSelectors' option to enable cross file selectors"
    `);
  });

  it("should remove string and number constants from the ts code", async () => {
    expect(
      await tsloader.call(
        loaderContext,
        `
import { styled, css } from "next-yak";

const red = "#E50914";
const zIndex = 14;
const headline = css\`
  color: \${red};
  z-index: \${zIndex};
\`
`,
      ),
    ).toMatchInlineSnapshot(`
      "import { styled, css } from \\"next-yak/internal\\";
      import __styleYak from \\"./page.yak.module.css!=!./page?./page.yak.module.css\\";
      const red = \\"#E50914\\";
      const zIndex = 14;
      const headline =
      /*YAK Extracted CSS:
      .headline {
        color: #E50914;
        z-index: 14;
      }*/
      /*#__PURE__*/
      css(__styleYak.headline);"
    `);
  });

  it("should show error when using a runtime value from top level", async () => {
    await expect(() =>
      tsloader.call(
        loaderContext,
        `
import { styled, css } from "next-yak";

const red = new Token("#E50914");
const headline = css\`
  color: \${red};
\`
`,
      ),
    ).rejects.toThrowErrorMatchingInlineSnapshot(`
      "/some/special/path/page.tsx: line 6: Could not resolve value for red
      found: \${red}"
    `);
  });

  it("should show error when using a runtime value from top level in a nested literal", async () => {
    await expect(() =>
      tsloader.call(
        loaderContext,
        `
        import { styled, css } from "next-yak";

        const $red = new Token("#E50914");
        const Button = styled.button\`
          \${({ $primary, $digits }) => {
            return $primary && css\`
              background-color: #4CAF50;
              color: \${$red};
            \`}}
        \`
`,
      ),
    ).rejects.toThrowErrorMatchingInlineSnapshot(`
      "/some/special/path/page.tsx: line 9: Could not resolve value for $red
      found: \${$red}"
    `);
  });

  it("should show error when calling a runtime value from top level in a nested literal", async () => {
    await expect(() =>
      tsloader.call(
        loaderContext,
        `
        import { styled, css } from "next-yak";
        import { red } from "./colors";

        const Button = styled.button\`
          \${({ $primary, $digits }) => {
            return $primary && css\`
              background-color: #4CAF50;
              color: \${red()};
            \`}}
        \`
`,
      ),
    ).rejects.toThrowErrorMatchingInlineSnapshot(`
      "/some/special/path/page.tsx: line 9: Possible constant used as runtime value for a css variable
      found: \${red()}
      Please move the constant to a .yak import or use an arrow function
      e.g.:
      |   import { primaryColor } from './foo.yak'
      |   const MyStyledDiv = styled.div\`color: \${primaryColor};\`"
    `);
  });

  it("should show error when calling a nested runtime value from top level in a nested literal", async () => {
    await expect(() =>
      tsloader.call(
        loaderContext,
        `
        import { styled, css } from "next-yak";
        import { colors } from "./colors";

        const Button = styled.button\`
          \${({ $primary, $digits }) => {
            return $primary && css\`
              background-color: #4CAF50;
              color: \${colors.red()};
            \`}}
        \`
`,
      ),
    ).rejects.toThrowErrorMatchingInlineSnapshot(`
      "/some/special/path/page.tsx: line 9: Possible constant used as runtime value for a css variable
      found: \${colors.red()}
      Please move the constant to a .yak import or use an arrow function
      e.g.:
      |   import { primaryColor } from './foo.yak'
      |   const MyStyledDiv = styled.div\`color: \${primaryColor};\`"
    `);
  });

  it("should show error when using a runtime value from another module in a nested literal", async () => {
    await expect(() =>
      tsloader.call(
        loaderContext,
        `
        import { styled, css } from "next-yak";
        import $red from "./colors";
        
        const Button = styled.button\`
          \${({ $primary, $digits }) => {
            return $primary && css\`
              background-color: #4CAF50;
              color: \${$red};
            \`}}
        \`
`,
      ),
    ).rejects.toThrowErrorMatchingInlineSnapshot(`
      "/some/special/path/page.tsx: line 9: Module constants are not allowed in this context
      found: \${$red}
      Use the 'experiments.crossFileSelectors' option to enable cross file selectors"
    `);
  });

  it("should show error when using a runtime object value from top level in a nested literal", async () => {
    await expect(() =>
      tsloader.call(
        loaderContext,
        `
        import { styled, css } from "next-yak";

        const colors = { red:  "#E50914" };
        const Button = styled.button\`
          \${({ $primary, $digits }) => {
            return $primary && css\`
              background-color: #4CAF50;
              color: \${colors.red};
            \`}}
        \`
`,
      ),
    ).rejects.toThrowErrorMatchingInlineSnapshot(`
      "/some/special/path/page.tsx: line 9: Possible constant used as runtime value for a css variable
      found: \${colors.red}
      Please move the constant to a .yak import or use an arrow function
      e.g.:
      |   import { primaryColor } from './foo.yak'
      |   const MyStyledDiv = styled.div\`color: \${primaryColor};\`"
    `);
  });

  it("should show no error when using a scoped value", async () => {
    await expect(
      await tsloader.call(
        loaderContext,
        `
import { styled, css } from "next-yak";

const Button = styled.button\`
  \${({ $primary, $digits }) => {
    const indent = $digits * 10 + "px";
    return $primary && css\`
      background-color: #4CAF50;
      text-indent: \${indent};
    \`}}
\`
`,
      ),
    ).toMatchInlineSnapshot(`
      "import { styled, css } from \\"next-yak/internal\\";
      import __styleYak from \\"./page.yak.module.css!=!./page?./page.yak.module.css\\";
      const Button =
      /*YAK Extracted CSS:
      .Button__$primary {
        background-color: #4CAF50;
        text-indent: var(--Button__$primary__text-indent_18fi82j);
      }*/
      /*#__PURE__*/
      styled.button(({
        $primary,
        $digits
      }) => {
        const indent = $digits * 10 + \\"px\\";
        return $primary && /*#__PURE__*/css(__styleYak.Button__$primary, {
          \\"style\\": {
            \\"--Button__$primary__text-indent_18fi82j\\": indent
          }
        });
      });"
    `);
  });

  it("should ignores empty chunks if they include only a comment", async () => {
    expect(
      await tsloader.call(
        loaderContext,
        `
import styles from "./page.module.css";
import { css } from "next-yak";

const x = Math.random();
const headline = css\`
  /* comment */
  \${x > 0.5 && css\`
    color: blue;
  \`}
\`;
`,
      ),
    ).toMatchInlineSnapshot(`
      "import styles from \\"./page.module.css\\";
      import { css } from \\"next-yak/internal\\";
      import __styleYak from \\"./page.yak.module.css!=!./page?./page.yak.module.css\\";
      const x = Math.random();
      const headline =
      /*YAK Extracted CSS:
      .headline__headline {
        color: blue;
      }*/
      /*#__PURE__*/
      css(x > 0.5 && /*#__PURE__*/css(__styleYak.headline__headline));"
    `);
  });

  it("should show error when a dynamic selector is used after a comma", async () => {
    await expect(() =>
      tsloader.call(
        loaderContext,
        `
import { styled, css } from "next-yak";
import { test } from "another-module";

const Icon = styled.div\`
  \${test}, baz {
    font-weight: bold;
  }
\`
`,
      ),
    ).rejects.toThrowErrorMatchingInlineSnapshot(`
      "/some/special/path/page.tsx: line 6: Module constants are not allowed in this context
      found: \${test}
      Use the 'experiments.crossFileSelectors' option to enable cross file selectors"
    `);
  });

  it("should allow allow using a styled component as selector in the same file", async () => {
    expect(
      await tsloader.call(
        loaderContext,
        `
import styles from "./page.module.css";
import { styled, css } from "next-yak";

const Icon = styled.svg\`\`;
const Button = styled.button\`
  &:has(\${Icon}) {
    color: red;
  }
\`;

`,
      ),
    ).toMatchInlineSnapshot(`
      "import styles from \\"./page.module.css\\";
      import { styled, css } from \\"next-yak/internal\\";
      import __styleYak from \\"./page.yak.module.css!=!./page?./page.yak.module.css\\";
      const Icon =
      /*YAK Extracted CSS:
      .Icon {}
      */
      /*#__PURE__*/
      styled.svg(__styleYak.Icon);
      const Button =
      /*YAK Extracted CSS:
      .Button {
        &:has(.Icon) {
          color: red;
        }
      }*/
      /*#__PURE__*/
      styled.button(__styleYak.Button);"
    `);
  });

  it("should allow allow using an inline nested css literal", async () => {
    expect(
      await tsloader.call(
        loaderContext,
        `
     import styles from "./page.module.css";
     import { styled, css } from "next-yak";
     const Button = styled.button\`
      font-size: 2rem;
      font-weight: bold;

      form & {
        color: red;
      }

      .Icon {
        \${($primary) => $primary ? css\`background: black;

        \${($active) => $active && css\`color: red;\`}
        \${($active) => $active && Math.random() && css\`color: red;\`}
        
        \` : css\`background: white;\`}
      }

      display: block;
    }\`;
    `,
      ),
    ).toMatchInlineSnapshot(`
      "import styles from \\"./page.module.css\\";
      import { styled, css } from \\"next-yak/internal\\";
      import __styleYak from \\"./page.yak.module.css!=!./page?./page.yak.module.css\\";
      const Button =
      /*YAK Extracted CSS:
      .Button {
        font-size: 2rem;
        font-weight: bold;
        form & {
          color: red;
        }
      }
      .Button__$primary {
        .Icon {
          background: black;
        }
      }
      .Button__$primary_and_$active {
        .Icon {
          color: red;
        }
      }
      .Button__$primary_and_$active_and {
        .Icon {
          color: red;
        }
      }
      .Button__not_$primary {
        .Icon {
          background: white;
        }
      }
      .Button {
        display: block;
      }*/
      /*#__PURE__*/
      styled.button(__styleYak.Button, $primary => $primary ? /*#__PURE__*/css(__styleYak.Button__$primary, $active => $active && /*#__PURE__*/css(__styleYak.Button__$primary_and_$active), $active => $active && Math.random() && /*#__PURE__*/css(__styleYak.Button__$primary_and_$active_and)) : /*#__PURE__*/css(__styleYak.Button__not_$primary));"
    `);
  });

  it("should detect expressions with units and correctly append them in the css variable value", async () => {
    expect(
      await tsloader.call(
        loaderContext,
        `
     import styles from "./page.module.css";
     import { styled } from "next-yak";
     const Button = styled.button\`
        padding: \${() => 10}rem;
        margin: \${() => 4 * 2}px;
        z-index: \${() => 10 + 4};
        transform: translateX(\${() => 10}px) translateY(\${() => 10 / 2}px);
        font-family: "Arial", sans-serif;
     \`;

     `,
      ),
    ).toMatchInlineSnapshot(`
      "import styles from \\"./page.module.css\\";
      import { styled, __yak_unitPostFix } from \\"next-yak/internal\\";
      import __styleYak from \\"./page.yak.module.css!=!./page?./page.yak.module.css\\";
      const Button =
      /*YAK Extracted CSS:
      .Button {
        padding: var(--Button__padding_18fi82j);
        margin: var(--Button__margin_18fi82j);
        z-index: var(--Button__z-index_18fi82j);
        transform: translateX(var(--Button__transform_18fi82j)) translateY(var(--Button__transform_18fi82j_1));
        font-family: \\"Arial\\", sans-serif;
      }*/
      /*#__PURE__*/
      styled.button(__styleYak.Button, {
        \\"style\\": {
          \\"--Button__padding_18fi82j\\": __yak_unitPostFix(() => 10, \\"rem\\"),
          \\"--Button__margin_18fi82j\\": __yak_unitPostFix(() => 4 * 2, \\"px\\"),
          \\"--Button__z-index_18fi82j\\": () => 10 + 4,
          \\"--Button__transform_18fi82j\\": __yak_unitPostFix(() => 10, \\"px\\"),
          \\"--Button__transform_18fi82j_1\\": __yak_unitPostFix(() => 10 / 2, \\"px\\")
        }
      });"
    `);
  });

  it("should detect expressions with units in simple arrow functions", async () => {
    expect(
      await tsloader.call(
        loaderContext,
        `
     import styles from "./page.module.css";
     import { styled } from "next-yak";
     const ClockNumber = styled.div<{ index: number; children: ReactNode }>\`
       transform: translate(-50%, -50%) rotate(\${({ index }) => index * 30}deg)
          translate(0, -88px) rotate(\${({ index }) => -index * 30}deg);
     \`;      
     `,
      ),
    ).toMatchInlineSnapshot(`
      "import styles from \\"./page.module.css\\";
      import { styled, __yak_unitPostFix } from \\"next-yak/internal\\";
      import __styleYak from \\"./page.yak.module.css!=!./page?./page.yak.module.css\\";
      const ClockNumber =
      /*YAK Extracted CSS:
      .ClockNumber {
        transform: translate(-50%, -50%) rotate(var(--ClockNumber__transform_18fi82j))
      translate(0, -88px) rotate(var(--ClockNumber__transform_18fi82j_1));
      }*/
      /*#__PURE__*/
      styled.div(__styleYak.ClockNumber, {
        \\"style\\": {
          \\"--ClockNumber__transform_18fi82j\\": __yak_unitPostFix(({
            index
          }) => index * 30, \\"deg\\"),
          \\"--ClockNumber__transform_18fi82j_1\\": __yak_unitPostFix(({
            index
          }) => -index * 30, \\"deg\\")
        }
      });"
    `);
  });

  it("should detect expressions with units in complex arrow functions and wrap them with __yak_unitPostFix helper", async () => {
    expect(
      await tsloader.call(
        loaderContext,
        `
     import styles from "./page.module.css";
     import { css } from "next-yak";
     const case1 = css\`
        padding: \${({$indent}) => {
          if ($indent > 0) {
            return $indent * 3;
          }
          return 0;
        }}px;
     \`;
     
     `,
      ),
    ).toMatchInlineSnapshot(`
      "import styles from \\"./page.module.css\\";
      import { css, __yak_unitPostFix } from \\"next-yak/internal\\";
      import __styleYak from \\"./page.yak.module.css!=!./page?./page.yak.module.css\\";
      const case1 =
      /*YAK Extracted CSS:
      .case1 {
        padding: var(--case1__padding_18fi82j);
      }*/
      /*#__PURE__*/
      css(__styleYak.case1, {
        \\"style\\": {
          \\"--case1__padding_18fi82j\\": __yak_unitPostFix(({
            $indent
          }) => {
            if ($indent > 0) {
              return $indent * 3;
            }
            return 0;
          }, \\"px\\")
        }
      });"
    `);
  });

  it("should detect expressions with units in mixins", async () => {
    expect(
      await tsloader.call(
        loaderContext,
        `
      import { css } from "next-yak";
      const mixin1 = css\`
        padding: \${() => 4}px;
      \`;
      const value = 10;
      const mixin2 = css\`
        margin: \${() => size}px;
        top: \${() => spacing.xs}px;
        bottom: \${() => spacing[0]}PX;
        left: \${() => spacing()}px;
        right: \${value}px;
      \`
     `,
      ),
    ).toMatchInlineSnapshot(`
      "import { css, __yak_unitPostFix } from \\"next-yak/internal\\";
      import __styleYak from \\"./page.yak.module.css!=!./page?./page.yak.module.css\\";
      const mixin1 =
      /*YAK Extracted CSS:
      .mixin1 {
        padding: var(--mixin1__padding_18fi82j);
      }*/
      /*#__PURE__*/
      css(__styleYak.mixin1, {
        \\"style\\": {
          \\"--mixin1__padding_18fi82j\\": __yak_unitPostFix(() => 4, \\"px\\")
        }
      });
      const value = 10;
      const mixin2 =
      /*YAK Extracted CSS:
      .mixin2 {
        margin: var(--mixin2__margin_18fi82j);
        top: var(--mixin2__top_18fi82j);
        bottom: var(--mixin2__bottom_18fi82j);
        left: var(--mixin2__left_18fi82j);
        right: 10px;
      }*/
      /*#__PURE__*/
      css(__styleYak.mixin2, {
        \\"style\\": {
          \\"--mixin2__margin_18fi82j\\": __yak_unitPostFix(() => size, \\"px\\"),
          \\"--mixin2__top_18fi82j\\": __yak_unitPostFix(() => spacing.xs, \\"px\\"),
          \\"--mixin2__bottom_18fi82j\\": __yak_unitPostFix(() => spacing[0], \\"PX\\"),
          \\"--mixin2__left_18fi82j\\": __yak_unitPostFix(() => spacing(), \\"px\\")
        }
      });"
    `);
  });
});

it("should minify css variables for production", async () => {
  const code = await tsloader.call(
    { ...loaderContext, mode: "production" },
    `
 import styles from "./page.module.css";
 import { styled } from "next-yak";
 const ClockNumber = styled.div<{ index: number; children: ReactNode }>\`
   transform: translate(-50%, -50%) rotate(\${({ index }) => index * 30}deg)
      translate(0, -88px) rotate(\${({ index }) => -index * 30}deg);
 \`;      
 `,
  );
  const variableNames = code.match(/var\(--[a-zA-Z0-9_-]*\)/g);
  expect(variableNames.join("\n")).toMatchInlineSnapshot(`
    "var(--18fi82j)
    var(--18fi82j1)"
  `);
  const variableNameMaxLength = Math.max(...variableNames.map((v) => v.length));
  expect(variableNameMaxLength).toBeLessThanOrEqual("var(--hash___1)".length);
});

describe("css prop", () => {
  it("should work with a css property", async () => {
    expect(
      await tsloader.call(
        loaderContext,
        `
     import { css } from "next-yak";
     const elem = <div css={css\`
      padding: 10px;
      \`} />
      `,
      ),
    ).toMatchInlineSnapshot(`
      "import { css } from \\"next-yak/internal\\";
      import __styleYak from \\"./page.yak.module.css!=!./page?./page.yak.module.css\\";
      const elem = <div {...
      /*YAK Extracted CSS:
      .elem {
        padding: 10px;
      }*/
      /*#__PURE__*/
      css(__styleYak.elem)({})} />;"
    `);
  });
  it("should work with a css property that is not in the root jsx element", async () => {
    expect(
      await tsloader.call(
        loaderContext,
        `
     import { css, styled } from "next-yak";
     const MyComp = () => <div><p><div css={css\`
      padding: 10px;
      \`}>anything</div></p></div>
      `,
      ),
    ).toMatchInlineSnapshot(`
      "import { css, styled } from \\"next-yak/internal\\";
      import __styleYak from \\"./page.yak.module.css!=!./page?./page.yak.module.css\\";
      const MyComp = () => <div><p><div {...
          /*YAK Extracted CSS:
          .MyComp {
            padding: 10px;
          }*/
          /*#__PURE__*/
          css(__styleYak.MyComp)({})}>anything</div></p></div>;"
    `);
  });

  it("should work with css that is spreaded into another component", async () => {
    expect(
      await tsloader.call(
        loaderContext,
        `
     import { css, styled } from "next-yak";
     const MyComp = (p) => <div {...p} >anything</div>;
     const MyComp2 = () => <MyComp css={css\`
          padding: 10px;
      \`} />
      `,
      ),
    ).toMatchInlineSnapshot(`
      "import { css, styled } from \\"next-yak/internal\\";
      import __styleYak from \\"./page.yak.module.css!=!./page?./page.yak.module.css\\";
      const MyComp = p => <div {...p}>anything</div>;
      const MyComp2 = () => <MyComp {...
      /*YAK Extracted CSS:
      .MyComp2 {
        padding: 10px;
      }*/
      /*#__PURE__*/
      css(__styleYak.MyComp2)({})} />;"
    `);
  });

  it("should work with an object identifier", async () => {
    expect(
      await tsloader.call(
        loaderContext,
        `
     import { css, styled } from "next-yak";
     const TestObj = {
      TestMem: (p) => <div {...p} >anything</div>,
     }
     const MyComp2 = () => <TestObj.TestMem css={css\`
          padding: 10px;
      \`} />
      `,
      ),
    ).toMatchInlineSnapshot(`
      "import { css, styled } from \\"next-yak/internal\\";
      import __styleYak from \\"./page.yak.module.css!=!./page?./page.yak.module.css\\";
      const TestObj = {
        TestMem: p => <div {...p}>anything</div>
      };
      const MyComp2 = () => <TestObj.TestMem {...
      /*YAK Extracted CSS:
      .MyComp2 {
        padding: 10px;
      }*/
      /*#__PURE__*/
      css(__styleYak.MyComp2)({})} />;"
    `);
  });

  it("should work with nested object identifier", async () => {
    expect(
      await tsloader.call(
        loaderContext,
        `
     import { css, styled } from "next-yak";
     const test = {
      nested: {
        TestMem: (p) => <div {...p} >anything</div>,
      }
     }
     const MyComp2 = () => <test.nested.TestMem css={css\`
          padding: 10px;
      \`} />
      `,
      ),
    ).toMatchInlineSnapshot(`
      "import { css, styled } from \\"next-yak/internal\\";
      import __styleYak from \\"./page.yak.module.css!=!./page?./page.yak.module.css\\";
      const test = {
        nested: {
          TestMem: p => <div {...p}>anything</div>
        }
      };
      const MyComp2 = () => <test.nested.TestMem {...
      /*YAK Extracted CSS:
      .MyComp2 {
        padding: 10px;
      }*/
      /*#__PURE__*/
      css(__styleYak.MyComp2)({})} />;"
    `);
  });

  it("should work with custom elements", async () => {
    expect(
      await tsloader.call(
        loaderContext,
        `
     import { css, styled } from "next-yak";
     const MyComp2 = () => <custom-element css={css\`
          padding: 10px;
      \`} />
      `,
      ),
    ).toMatchInlineSnapshot(`
      "import { css, styled } from \\"next-yak/internal\\";
      import __styleYak from \\"./page.yak.module.css!=!./page?./page.yak.module.css\\";
      const MyComp2 = () => <custom-element {...
      /*YAK Extracted CSS:
      .MyComp2 {
        padding: 10px;
      }*/
      /*#__PURE__*/
      css(__styleYak.MyComp2)({})} />;"
    `);
  });

  it.skip("shouldn't convert it when css prop is a simple string", async () => {
    expect(
      await tsloader.call(
        loaderContext,
        `
     import { css, styled } from "next-yak";
     const MyComp = () => <div css={\`
        padding: 10px;
      \`}>anything</div>
      `,
      ),
    ).toMatchInlineSnapshot();
  });

  it("should work with when css property reuses css", async () => {
    expect(
      await tsloader.call(
        loaderContext,
        `
      import { css, styled } from "next-yak";
      const padding = css\`
        padding: 10px;
        \`; 
      const Elem = () =>  
        <div css={padding} />;
        `,
      ),
    ).toMatchInlineSnapshot(`
      "import { css, styled } from \\"next-yak/internal\\";
      import __styleYak from \\"./page.yak.module.css!=!./page?./page.yak.module.css\\";
      const padding =
      /*YAK Extracted CSS:
      .padding {
        padding: 10px;
      }*/
      /*#__PURE__*/
      css(__styleYak.padding);
      const Elem = () => <div {...padding({})} />;"
    `);
  });

  it("should work when css property is conditionally applied", async () => {
    expect(
      await tsloader.call(
        loaderContext,
        `
     import { css, styled } from "next-yak";
     const MyComp = () => <div css={true && css\`
        padding: 10px;
      \`}>anything</div>
      `,
      ),
    ).toMatchInlineSnapshot(`
      "import { css, styled } from \\"next-yak/internal\\";
      import __styleYak from \\"./page.yak.module.css!=!./page?./page.yak.module.css\\";
      const MyComp = () => <div {...(true &&
      /*YAK Extracted CSS:
      .MyComp {
        padding: 10px;
      }*/
      /*#__PURE__*/
      css(__styleYak.MyComp))({})}>anything</div>;"
    `);
  });

  it("should work when css property is conditionally not applied", async () => {
    expect(
      await tsloader.call(
        loaderContext,
        `
     import { css, styled } from "next-yak";
     const MyComp = () => <div css={false && css\`
        padding: 10px;
      \`}>anything</div>
      `,
      ),
    ).toMatchInlineSnapshot(`
      "import { css, styled } from \\"next-yak/internal\\";
      import __styleYak from \\"./page.yak.module.css!=!./page?./page.yak.module.css\\";
      const MyComp = () => <div {...(false &&
      /*YAK Extracted CSS:
      .MyComp {
        padding: 10px;
      }*/
      /*#__PURE__*/
      css(__styleYak.MyComp))({})}>anything</div>;"
    `);
  });

  it("should allow conditional css properties", async () => {
    expect(
      await tsloader.call(
        loaderContext,
        `
      import { css, styled } from "next-yak";
      const padding = css\`
        padding: 10px;
        \`; 
      const Elem = () =>  
        <div css={true ? padding : css\`
          padding: 20px;
        \`} />;
        `,
      ),
    ).toMatchInlineSnapshot(`
      "import { css, styled } from \\"next-yak/internal\\";
      import __styleYak from \\"./page.yak.module.css!=!./page?./page.yak.module.css\\";
      const padding =
      /*YAK Extracted CSS:
      .padding {
        padding: 10px;
      }*/
      /*#__PURE__*/
      css(__styleYak.padding);
      const Elem = () => <div {...(true ? padding :
      /*YAK Extracted CSS:
      .Elem {
        padding: 20px;
      }*/
      /*#__PURE__*/
      css(__styleYak.Elem))({})} />;"
    `);
  });
  describe("merge properties", () => {
    it("when className is set", async () => {
      expect(
        await tsloader.call(
          loaderContext,
          `
      import { css, styled } from "next-yak";
      const Elem = () => <div className="foo" css={css\`
        padding: 10px;
        \`} />;
      `,
        ),
      ).toMatchInlineSnapshot(`
        "import { css, styled, __yak_mergeCssProp } from \\"next-yak/internal\\";
        import __styleYak from \\"./page.yak.module.css!=!./page?./page.yak.module.css\\";
        const Elem = () => <div {...__yak_mergeCssProp({
          className: \\"foo\\"
        },
        /*YAK Extracted CSS:
        .Elem {
          padding: 10px;
        }*/
        /*#__PURE__*/
        css(__styleYak.Elem)({}))} />;"
      `);
    });
    it("when style is set", async () => {
      expect(
        await tsloader.call(
          loaderContext,
          `
      import { css, styled } from "next-yak";
      const Elem = () => <div style={{padding: "5px"}} css={css\`
        padding: 10px;
        \`} />;
      `,
        ),
      ).toMatchInlineSnapshot(`
        "import { css, styled, __yak_mergeCssProp } from \\"next-yak/internal\\";
        import __styleYak from \\"./page.yak.module.css!=!./page?./page.yak.module.css\\";
        const Elem = () => <div {...__yak_mergeCssProp({
          style: {
            padding: \\"5px\\"
          }
        },
        /*YAK Extracted CSS:
        .Elem {
          padding: 10px;
        }*/
        /*#__PURE__*/
        css(__styleYak.Elem)({}))} />;"
      `);
    });
    it("when spreaded property is set", async () => {
      expect(
        await tsloader.call(
          loaderContext,
          `
      import { css, styled } from "next-yak";
      const Elem = () => <div {...{className: "foo"}} css={css\`
        padding: 10px;
        \`} />;
      `,
        ),
      ).toMatchInlineSnapshot(`
        "import { css, styled, __yak_mergeCssProp } from \\"next-yak/internal\\";
        import __styleYak from \\"./page.yak.module.css!=!./page?./page.yak.module.css\\";
        const Elem = () => <div {...__yak_mergeCssProp({
          className: \\"foo\\"
        },
        /*YAK Extracted CSS:
        .Elem {
          padding: 10px;
        }*/
        /*#__PURE__*/
        css(__styleYak.Elem)({}))} />;"
      `);
    });
    it("when class name and style is set", async () => {
      expect(
        await tsloader.call(
          loaderContext,
          `
      import { css, styled } from "next-yak";
      const Elem = () => <div className="foo" style={{padding: "5px"}} css={css\`
        padding: 10px;
        \`} />;
      `,
        ),
      ).toMatchInlineSnapshot(`
        "import { css, styled, __yak_mergeCssProp } from \\"next-yak/internal\\";
        import __styleYak from \\"./page.yak.module.css!=!./page?./page.yak.module.css\\";
        const Elem = () => <div {...__yak_mergeCssProp({
          className: \\"foo\\",
          style: {
            padding: \\"5px\\"
          }
        },
        /*YAK Extracted CSS:
        .Elem {
          padding: 10px;
        }*/
        /*#__PURE__*/
        css(__styleYak.Elem)({}))} />;"
      `);
    });
    it("when class name, style and spreaded property is set", async () => {
      expect(
        await tsloader.call(
          loaderContext,
          `
      import { css, styled } from "next-yak";
      const Elem = () => <div className="foo" style={{padding: "5px"}} {...{className: "foo2"}} css={css\`
        padding: 10px;
        \`} />;
      `,
        ),
      ).toMatchInlineSnapshot(`
        "import { css, styled, __yak_mergeCssProp } from \\"next-yak/internal\\";
        import __styleYak from \\"./page.yak.module.css!=!./page?./page.yak.module.css\\";
        const Elem = () => <div {...__yak_mergeCssProp({
          className: \\"foo\\",
          style: {
            padding: \\"5px\\"
          },
          ...{
            className: \\"foo2\\"
          }
        },
        /*YAK Extracted CSS:
        .Elem {
          padding: 10px;
        }*/
        /*#__PURE__*/
        css(__styleYak.Elem)({}))} />;"
      `);
    });
    it("when props are spreaded", async () => {
      expect(
        await tsloader.call(
          loaderContext,
          `
      import { css, styled } from "next-yak";
      const Elem = (props) => <div css={css\`
        padding: 10px;
        \`} {...props} />;
      `,
        ),
      ).toMatchInlineSnapshot(`
        "import { css, styled, __yak_mergeCssProp } from \\"next-yak/internal\\";
        import __styleYak from \\"./page.yak.module.css!=!./page?./page.yak.module.css\\";
        const Elem = props => <div {...__yak_mergeCssProp(props,
        /*YAK Extracted CSS:
        .Elem {
          padding: 10px;
        }*/
        /*#__PURE__*/
        css(__styleYak.Elem)({}))} />;"
      `);
    });
    it("throws an error when dynamic properties are used", async () => {
      expect(
        await tsloader.call(
          loaderContext,
          `
      import { css, styled } from "next-yak";
      const Elem = (props) => <div css={css\`
        padding: \${() => props.dynamicPadding ? '10px' : "0"}px;
        \${() => props.active && css\`color: orange\`}
        \`} {...props} />;
      `,
        ),
      ).toMatchInlineSnapshot(`
        "import { css, styled, __yak_mergeCssProp, __yak_unitPostFix } from \\"next-yak/internal\\";
        import __styleYak from \\"./page.yak.module.css!=!./page?./page.yak.module.css\\";
        const Elem = props => <div {...__yak_mergeCssProp(props,
        /*YAK Extracted CSS:
        .Elem {
          padding: var(--Elem__padding_18fi82j);
        }
        .Elem__propsActive {
          color: orange;
        }*/
        /*#__PURE__*/
        css(__styleYak.Elem, () => props.active && /*#__PURE__*/css(__styleYak.Elem__propsActive), {
          \\"style\\": {
            \\"--Elem__padding_18fi82j\\": __yak_unitPostFix(() => props.dynamicPadding ? '10px' : \\"0\\", \\"px\\")
          }
        })({}))} />;"
      `);
    });
  });
});

describe("cross file", () => {
  it("compiles selectors", async () => {
    expect(
      await tsloader.call(
        {
          ...loaderContext,
          getOptions: () => ({
            configPath: "/some/special/path/config",
            experiments: { crossFileSelectors: true },
          }),
        },
        `
      import { css, styled } from "next-yak";
      import { Icon } from "./icon";
      const Button = styled.button\`
        /* Add some margin to the icon */
        \${Icon} { margin: 0 10px; }
        \`; 
    `,
      ),
    ).toMatchInlineSnapshot(`
      "import { css, styled } from \\"next-yak/internal\\";
      import __styleYak from \\"./page.yak.module.css!=!./page?./page.yak.module.css\\";
      import { Icon } from \\"./icon\\";
      const Button =
      /*YAK Extracted CSS:
      .Button {
        --yak-css-import: url(\\"./icon:Icon\\") {
          margin: 0 10px;
        }
      }*/
      /*#__PURE__*/
      styled.button(__styleYak.Button);"
    `);
  });
});
