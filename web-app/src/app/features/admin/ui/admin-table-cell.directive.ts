import { Directive, Input, TemplateRef, inject } from '@angular/core';

/**
 * Marks a custom cell/actions/filter template for {@link AdminDataTableComponent}.
 * Use `*adCell="'colKey'"` for a column body, `*adCell="'actions'"` for the row
 * actions column, or `*adCell="'filter:colKey'"` for a custom filter control.
 * The row is exposed as the template's implicit context.
 */
@Directive({
  selector: '[adCell]',
  standalone: true,
})
export class AdminTableCellDirective {
  @Input('adCell') name = '';
  readonly tpl = inject(TemplateRef);
}
