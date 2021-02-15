module.exports = {
  type: 'root',
  children: [
    {
      type: 'text',
      value: '\n  ',
      position: {
        start: {
          line: 1,
          column: 1,
          offset: 0,
        },
        end: {
          line: 2,
          column: 3,
          offset: 3,
        },
      },
    },
    {
      type: 'element',
      tagName: 'div',
      properties: {},
      children: [
        {
          type: 'text',
          value: 'HTML AST',
          position: {
            start: {
              line: 2,
              column: 8,
              offset: 8,
            },
            end: {
              line: 2,
              column: 16,
              offset: 16,
            },
          },
        },
      ],
      position: {
        start: {
          line: 2,
          column: 3,
          offset: 3,
        },
        end: {
          line: 2,
          column: 22,
          offset: 22,
        },
      },
    },
    {
      type: 'text',
      value: '\n  ',
      position: {
        start: {
          line: 2,
          column: 22,
          offset: 22,
        },
        end: {
          line: 3,
          column: 3,
          offset: 25,
        },
      },
    },
    {
      type: 'element',
      tagName: 'web-component',
      properties: {
        foo: 'bar',
      },
      children: [
        {
          type: 'text',
          value: '\n    ',
          position: {
            start: {
              line: 3,
              column: 28,
              offset: 50,
            },
            end: {
              line: 4,
              column: 5,
              offset: 55,
            },
          },
        },
        {
          type: 'element',
          tagName: 'p',
          properties: {},
          children: [
            {
              type: 'text',
              value: 'hey',
              position: {
                start: {
                  line: 4,
                  column: 8,
                  offset: 58,
                },
                end: {
                  line: 4,
                  column: 11,
                  offset: 61,
                },
              },
            },
          ],
          position: {
            start: {
              line: 4,
              column: 5,
              offset: 55,
            },
            end: {
              line: 4,
              column: 15,
              offset: 65,
            },
          },
        },
        {
          type: 'text',
          value: '\n  ',
          position: {
            start: {
              line: 4,
              column: 15,
              offset: 65,
            },
            end: {
              line: 5,
              column: 3,
              offset: 68,
            },
          },
        },
      ],
      position: {
        start: {
          line: 3,
          column: 3,
          offset: 25,
        },
        end: {
          line: 5,
          column: 19,
          offset: 84,
        },
      },
    },
    {
      type: 'text',
      value: '\n  ',
      position: {
        start: {
          line: 5,
          column: 19,
          offset: 84,
        },
        end: {
          line: 6,
          column: 3,
          offset: 87,
        },
      },
    },
    {
      type: 'element',
      tagName: 'web-component',
      properties: {
        foo: 'baz',
      },
      children: [],
      position: {
        start: {
          line: 6,
          column: 3,
          offset: 87,
        },
        end: {
          line: 6,
          column: 44,
          offset: 128,
        },
      },
    },
    {
      type: 'text',
      value: '\n',
      position: {
        start: {
          line: 6,
          column: 44,
          offset: 128,
        },
        end: {
          line: 7,
          column: 1,
          offset: 129,
        },
      },
    },
  ],
  data: {
    quirksMode: false,
  },
  position: {
    start: {
      line: 1,
      column: 1,
      offset: 0,
    },
    end: {
      line: 7,
      column: 1,
      offset: 129,
    },
  },
}
