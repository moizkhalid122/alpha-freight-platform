"use client";

import { useId } from "react";
import ReactSelect, { type GroupBase, type Props } from "react-select";
import { adminSelectClassNames } from "@/lib/admin-ui";

/**
 * Hydration-safe react-select for admin pages with compact premium styling.
 */
export default function AdminSelect<
  Option,
  IsMulti extends boolean = false,
  Group extends GroupBase<Option> = GroupBase<Option>,
>(props: Props<Option, IsMulti, Group>) {
  const reactId = useId().replace(/:/g, "");

  return (
    <ReactSelect
      {...props}
      instanceId={props.instanceId ?? `admin-select-${reactId}`}
      classNames={{ ...adminSelectClassNames, ...(props.classNames ?? {}) }}
    />
  );
}
