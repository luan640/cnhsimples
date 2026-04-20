declare module '@base-ui/react/button' {
  import * as React from 'react'

  namespace Button {
    interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
      render?: React.ReactElement | ((props: React.ButtonHTMLAttributes<HTMLButtonElement>) => React.ReactElement)
    }
  }

  function Button(props: Button.Props): React.ReactElement

  export { Button }
}
