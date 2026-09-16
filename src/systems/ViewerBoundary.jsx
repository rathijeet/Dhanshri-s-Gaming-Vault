import { Component } from 'react'
import Icon from '../components/Icon'

// The 3D view is the nicest part of the builder but it is not the point of it —
// a WebGL failure, an old GPU or a driver quirk must cost the customer the
// picture, never the prices and the parts list. Without this, one throw inside
// the viewer unmounts the whole page.
export default class ViewerBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { failed: false }
  }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error, info) {
    console.error('[systems] 3D viewer failed', error, info)
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center text-center px-6">
          <Icon name="view_in_ar" className="!text-4xl text-on-surface-variant opacity-40 mb-2" />
          <p className="font-body-md text-sm text-on-surface-variant">
            The 3D preview can&rsquo;t run on this device.
          </p>
          <p className="font-body-md text-xs text-on-surface-variant mt-1">
            Your build and pricing below are unaffected.
          </p>
        </div>
      )
    }
    return this.props.children
  }
}
