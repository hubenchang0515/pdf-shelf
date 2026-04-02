import { For, Show } from "solid-js";

export default function Outline(props: {
  items: any[];
  onJump: (dest: any) => void;
}) {
  return (
    <ul>
      <For each={props.items}>
        {(item) => (
          <li class="my-2 ps-4">
            <div
              class="cursor-pointer text-black dark:text-white hover:text-emerald-500"
              onClick={() => props.onJump(item.dest)}
            >
              {item.title}
            </div>

            <Show when={item.items?.length}>
              <Outline items={item.items} onJump={props.onJump} />
            </Show>
          </li>
        )}
      </For>
    </ul>
  );
}