import type {
  ComponentInternalInstance,
  ComponentPublicInstance,
  VNode,
} from '@vue/runtime-core'
import { camelize, hyphenate } from '@vue/shared'

import { isBuiltInComponent } from './tags'
import { SLOT_DEFAULT_NAME } from './constants'

export function isComponentInternalInstance(
  vm: unknown
): vm is ComponentInternalInstance {
  return !!(vm as ComponentInternalInstance).appContext
}

export function resolveComponentInstance(
  instance?: ComponentInternalInstance | ComponentPublicInstance
) {
  return (
    instance &&
    (isComponentInternalInstance(instance) ? instance.proxy! : instance)
  )
}

export function resolveOwnerVm(vm: ComponentInternalInstance) {
  if (!vm) {
    return
  }
  let componentName = vm.type.name
  while (componentName && isBuiltInComponent(hyphenate(componentName))) {
    // ownerInstance 内置组件需要使用父 vm
    vm = vm.parent!
    componentName = vm.type.name
  }
  return vm.proxy!
}

function isElement(el: Element) {
  // Element
  return el.nodeType === 1
}

export function resolveOwnerEl(instance: ComponentInternalInstance) {
  const { vnode } = instance
  if (isElement(vnode.el as Element)) {
    return vnode.el
  }
  const { subTree } = instance
  // ShapeFlags.ARRAY_CHILDREN = 1<<4
  if (subTree.shapeFlag & 16) {
    const elemVNode = (subTree.children as VNode[]).find(
      (vnode) => vnode.el && isElement(vnode.el as Element)
    )
    if (elemVNode) {
      return elemVNode.el
    }
  }
  return vnode.el
}

export function dynamicSlotName(name: string) {
  return name === 'default' ? SLOT_DEFAULT_NAME : name
}

const customizeRE = /:/g

export function customizeEvent(str: string) {
  return camelize(str.replace(customizeRE, '-'))
}
