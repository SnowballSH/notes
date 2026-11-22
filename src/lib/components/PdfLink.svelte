<script lang="ts">
import { notePdfHref } from "#lib/notes/names.ts";

const { course, slug }: { course: string; slug: string } = $props();
</script>

<a class="note-control" href={notePdfHref({ course, slug })} download={`${slug}.pdf`}>Download PDF</a>
