// This is a component file. You can use this file to define a custom component for your project.
// This component will appear as a custom component in the editor.

import * as ecs from '@8thwall/ecs'  // This is how you access the ecs library.

ecs.registerComponent({
  name: 'selector',
  schema: {
    options: ecs.eid,
  },
  stateMachine: ({world, eid, schemaAttribute}) => {
    const showOptions = ecs.defineTrigger()
    const hideOptions = ecs.defineTrigger()

    ecs.defineState('hide-options')
      .onEnter(() => {
        const {options} = schemaAttribute.get(eid)
        ecs.Hidden.set(world, options)
      })
      .listen(eid, ecs.input.UI_CLICK, () => {
        showOptions.trigger()
      })
      .onTrigger(showOptions, 'show-options')
      .initial()

    ecs.defineState('show-options')
      .onEnter(() => {
        const {options} = schemaAttribute.get(eid)
        ecs.Hidden.remove(world, options)
      })
      .listen(eid, ecs.input.UI_CLICK, () => {
        hideOptions.trigger()
      })
      .onTrigger(hideOptions, 'hide-options')
  },
})
